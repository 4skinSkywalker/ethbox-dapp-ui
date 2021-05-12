import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ADDRESS_ZERO, ZERO, MAX_VALUE } from '../constants/various';
import { ETHBOX, TOKEN_DISPENSER, ERC20_ABI } from '../constants/abis';
import { ERC20_LIST, BEP20_LIST } from '../constants/tokens';
import { Balance, Box, BoxInputs, DateInfo } from '../interfaces';
import { LoadingIndicatorService } from './loading-indicator.service';
import { ToasterService } from './toaster.service';
import BigNumber from 'bignumber.js';
import { ConfirmDialogService } from './confirm-dialog.service';
import { PromptDialogService } from './prompt-dialog.service';

// This is needed to get Web3 and Web3Modal into this service
let win: any = window;

@Injectable({
    providedIn: 'root'
})
export class ContractService {

    // Observables tied to various events, see these as top level variables in the app context
    // Subject simply emits a value that can be capture by current listeners, while BehaviorSubject emits a value but also remembers it for future listeners 
    balanceChanged$ = new Subject();
    boxes$ = new BehaviorSubject(null);
    tokens$ = new BehaviorSubject(null);
    isAppReady$ = new BehaviorSubject(false);
    chainId$ = new BehaviorSubject(null);
    selectedAccount$ = new BehaviorSubject(null);

    // Tokens map lets you query tokens by their addresses in O(1), useful to find logos and decimals in a blink of an eye
    tokensMap;
    private ERC20_MAP = ERC20_LIST.reduce((a, b) => (a[b.address] = b, a), {});
    private BEP20_MAP = BEP20_LIST.reduce((a, b) => (a[b.address] = b, a), {});

    // These fields are changing values when chain is changed (look fetchVariables())
    private testTokensAddresses = {
        'AAA': null,
        'BBB': null,
        'CCC': null
    };
    private ethboxAddress;
    private tokenDispenserAddress;
    private tokenDispenserContract;
    private ethboxContract;

    // Unpkg imports
    private Web3Modal = win.Web3Modal.default;
    private WalletConnectProvider = win.WalletConnectProvider.default;
    private Fortmatic = win.Fortmatic;

    // API keys for various providers
    private WALLECTCONNECT_APIKEY = '8043bb2cf99347b1bfadfb233c5325c0'; // Mikko's key
    private FORTMATIC_APIKEY = 'pk_test_391E26A3B43A3350'; // Mikko's key

    private web3Modal;
    private provider;
    private web3;

    constructor(
        private loadingIndicatorServ: LoadingIndicatorService,
        private ngZone: NgZone,
        private toasterServ: ToasterService,
        private confirmDialogServ: ConfirmDialogService,
        private promptDialogServ: PromptDialogService) {
        this.init();
    }

    async connect(): Promise<void> {

        try {
            this.provider = await this.web3Modal.connect();
            this.web3 = new win.Web3(this.provider);
        }
        catch (error) {
            this.toasterServ.toastMessage$.next({
                type: 'danger',
                message: 'Could not get a wallet connection. Details in the console',
                duration: 'long'
            });
            console.log('Could not get a wallet connection', error);
            return;
        }

        // Adds listeners to refresh variables on chain and accounts changes
        this.provider.on('chainChanged', () =>
            this.ngZone.run(() => this.fetchVariables()));
        this.provider.on('accountsChanged', () =>
            this.ngZone.run(() => this.fetchVariables()));

        // Wallet initialized
        await this.fetchVariables();
    }

    async disconnect(): Promise<void> {

        if (this.provider.close) {
            await this.provider.close();

            // If the cached provider is not cleared, WalletConnect will default to the existing session and does not allow to re-scan the QR code with a new wallet
            await this.web3Modal.clearCachedProvider();
            this.provider = null;
        }

        this.web3 = null;
        this.provider.removeAllListeners('chainChanged');
        this.provider.removeAllListeners('accountsChanged');
        this.provider = null;
        this.chainId$.next(null);
        this.selectedAccount$.next(null);
        this.resetVariables();
    }

    give100TestToken(testTokenSymbol: string): void {

        this.tokenDispenserContract.methods
            .give_token(
                win.Web3.utils.toWei('100'),
                this.testTokensAddresses[testTokenSymbol])
            .send({ from: this.selectedAccount$.getValue() })
            .on('transactionHash', hash =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'secondary',
                        message: 'May take a while, please wait...',
                        duration: 'short'
                    });

                    this.loadingIndicatorServ.on();
                }))
            .on('receipt', receipt =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'success',
                        message: `You have received 100 ${testTokenSymbol} tokens!`,
                        duration: 'long'
                    });

                    this.balanceChanged$.next(true);
                    this.loadingIndicatorServ.off();
                }))
            .on('error', (error, receipt) =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'danger',
                        message: 'Token dispensing aborted. Details in the console',
                        duration: 'long'
                    });
                    console.log('Token dispensing aborted', error, receipt);

                    this.loadingIndicatorServ.off();
                }));
    }

    isSupportedChain() {
        return [4, 97].includes(this.chainId$.getValue());
    }

    isEthereum(): boolean {
        return [4].includes(this.chainId$.getValue());
    }

    isBinance(): boolean {
        return [97].includes(this.chainId$.getValue());
    }

    encodeSmartContractTimestamp(jsDate: Date): string {

        let year = jsDate.getUTCFullYear();
        year = year - 100 * Math.floor(year / 100);
        let month = jsDate.getUTCMonth();
        let date = jsDate.getUTCDate();
        let minutesInDay = 60 * jsDate.getUTCHours() + jsDate.getUTCMinutes();

        return (((year & 0x7f) << 20)
            + ((month & 0x0f) << 16)
            + ((date & 0x1f) << 11)
            + (minutesInDay & 0x07ff)).toString();
    }

    decodeSmartContractTimestamp(smartContractTimestamp: string): DateInfo {

        let scTimestamp = Number(smartContractTimestamp);
        let year = (scTimestamp & 0x07f00000) >>> 20;
        let month = ((scTimestamp & 0x0f0000) >>> 16) + 1;
        let date = (scTimestamp & 0xf800) >>> 11;
        let minutesInDay = (scTimestamp & 0x07ff) - new Date().getTimezoneOffset();

        if (minutesInDay >= 1440) {
            minutesInDay -= 1440;
            date++;
        }
        else if (minutesInDay < 0) {
            minutesInDay += 1440;
            date--;
        }

        let hours = Math.floor(minutesInDay / 60);
        let minutes = minutesInDay - hours * 60;

        let monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        let unixTimestamp = Date.parse(`${month}/${date}/20${year} ${hours}:${minutes}`);
        let readableTimestamp = `${monthNames[month - 1]} ${date} 20${year} ${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}`;
        let jsDate = new Date(unixTimestamp);

        return {
            unixTimestamp,
            readableTimestamp,
            jsDate
        };
    }

    isValidAddress(address: string): boolean {
        return win.Web3.utils.isAddress(address);
    }

    weiToDecimal(wei: string, decimals: string | number): string {
        let multiplier = '1' + ZERO.repeat(Number(decimals));
        let _wei = new BigNumber(wei);
        return _wei.dividedBy(multiplier).toString();
    }

    decimalToWei(decimalValue: string, decimals: string | number): string {

        let multiplier = '1' + ZERO.repeat(Number(decimals));
        let _decimal = new BigNumber(decimalValue);
        console.log(_decimal.multipliedBy(multiplier).toString());
        return _decimal.multipliedBy(multiplier).toString();
    }

    getTokenWeiFromDecimalValue(tokenAddress: string, decimalValue: string) {

        if (!this.tokensMap[tokenAddress]) {
            console.log('Token', tokenAddress, 'not found in', this.tokensMap);
            return;
        }

        let decimals = this.tokensMap[tokenAddress].decimals;
        return this.decimalToWei(decimalValue, decimals);
    }

    getTokenDecimalValueFromWei(tokenAddress: string, wei: string) {

        if (!this.tokensMap[tokenAddress]) {
            console.log('Token', tokenAddress, 'not found in', this.tokensMap);
            return;
        }

        let decimals = this.tokensMap[tokenAddress].decimals;
        return this.weiToDecimal(wei, decimals);
    }

    async getBalanceOf(tokenAddress: string): Promise<Balance> {

        if (!this.tokensMap[tokenAddress]) {
            console.log('Token', tokenAddress, 'not found in', this.tokensMap);
            return;
        }

        let selectedAccount = this.selectedAccount$.getValue();

        let decimals = this.tokensMap[tokenAddress].decimals,
            wei,
            weiAllowance;

        // If it's the base token, then mocks the allowance as unlimited (MAX_VALUE)
        if (tokenAddress == ADDRESS_ZERO) {
            wei = await this.web3.eth
                .getBalance(selectedAccount);
            weiAllowance = MAX_VALUE;
        }
        else {
            let tokenContract = new this.web3.eth.Contract(ERC20_ABI, tokenAddress);
            wei = await tokenContract.methods
                .balanceOf(selectedAccount)
                .call({ from: selectedAccount });
            weiAllowance = await this.getWeiAllowance(tokenAddress);
        }

        return {
            wei,
            decimals,
            decimalValue: this.weiToDecimal(wei, decimals),
            hasUnlimitedAllowance: weiAllowance == MAX_VALUE
        };
    }

    async approveMax(tokenAddress: string): Promise<void> {

        let tokenContract = new this.web3.eth.Contract(ERC20_ABI, tokenAddress);

        this.loadingIndicatorServ.on();
        try {
            await tokenContract.methods
                .approve(this.ethboxAddress, MAX_VALUE)
                .send({ from: this.selectedAccount$.getValue() });

            this.toasterServ.toastMessage$.next({
                type: 'secondary',
                message: 'Approved! Now you can send/exchange this token',
                duration: 'long'
            });

            this.balanceChanged$.next(true);
            this.loadingIndicatorServ.off();
        }
        catch (error) {
            this.toasterServ.toastMessage$.next({
                type: 'danger',
                message: 'Could not approve tokens. Details in the console',
                duration: 'long'
            });
            console.log('Approval aborted', error);

            this.loadingIndicatorServ.off();

            // Re-throwing the error in order to catch it somewhere else (e.g. acceptBox())
            throw new Error(error);
        }
    }

    isValidPassword(box: Box, password: string): boolean {
        let sha3 = win.Web3.utils.soliditySha3;
        return box.pass_hash_hash === sha3(sha3(password));
    }

    async createBox(boxInputs: BoxInputs): Promise<void> {

        let passHashHash = win.Web3.utils.soliditySha3(
            win.Web3.utils.soliditySha3(boxInputs.password)
        );

        let sendWei = this.getTokenWeiFromDecimalValue(
            boxInputs.sendTokenAddress,
            boxInputs.sendDecimalValue);

        let requestWei = this.getTokenWeiFromDecimalValue(
            boxInputs.requestTokenAddress,
            boxInputs.requestDecimalValue);

        let baseTokenWei = ZERO;
        if (boxInputs.sendTokenAddress == ADDRESS_ZERO) {
            baseTokenWei = sendWei;
        }

        let scTimestamp = this.encodeSmartContractTimestamp(boxInputs.jsDate);

        this.ethboxContract.methods
            .create_box(
                boxInputs.recipient,
                boxInputs.sendTokenAddress,
                sendWei,
                boxInputs.requestTokenAddress,
                requestWei,
                passHashHash,
                scTimestamp)
            .send({
                from: this.selectedAccount$.getValue(),
                value: baseTokenWei
            })
            .on('transactionHash', hash =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'secondary',
                        message: 'May take a while, please wait...',
                        duration: 'short'
                    });

                    this.loadingIndicatorServ.on();
                }))
            .on('receipt', receipt =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'success',
                        message: 'Your box has been created!',
                        duration: 'long'
                    });

                    this.balanceChanged$.next(true);
                    this.loadingIndicatorServ.off();
                }))
            .on('error', (error, receipt) =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'danger',
                        message: 'Box creation aborted. Details in the console',
                        duration: 'long'
                    });
                    console.log('Box creation aborted', error, receipt);

                    this.loadingIndicatorServ.off();
                }));
    }

    // Broadcasts boxes via observable
    async fetchBoxes(): Promise<void> {

        let boxes = await this.ethboxContract.methods.get_boxes()
            .call({ from: this.selectedAccount$.getValue() });
        this.boxes$.next(boxes);
        console.log('Boxes fetched successfully!');
    }

    async cancelBox(box: Box): Promise<void> {

        // This prompt is temporary until the new Smart Contract gets deployed
        let promptInputs: any = await this.promptDialogServ.spawn({
            dialogName: "Insert the passphrase",
            message: "What is the passphrase of this box?<br>(In future you won't need to do this to cancel a box)",
            inputs: {
                'password': {
                    label: 'Password',
                    value: ''
                }
            }
        });

        if (!promptInputs) {
            return;
        }

        let password = promptInputs.password.value;
        if (!this.isValidPassword(box, password)) {
            this.toasterServ.toastMessage$.next({
                type: 'danger',
                message: 'Passphrase is incorret. Please retry...',
                duration: 'long'
            });
            return;
        }

        let passHash = win.Web3.utils.soliditySha3(password);

        this.ethboxContract.methods
            .clear_box(box.index, passHash)
            .send({
                from: this.selectedAccount$.getValue(),
                value: ZERO
            })
            .on('transactionHash', hash =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'secondary',
                        message: 'May take a while, please wait...',
                        duration: 'short'
                    });

                    this.loadingIndicatorServ.on();
                }))
            .on('receipt', receipt =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'success',
                        message: 'Your box has been canceled!',
                        duration: 'long'
                    });

                    this.balanceChanged$.next(true);
                    this.loadingIndicatorServ.off();
                }))
            .on('error', (error, receipt) =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'danger',
                        message: 'Box cancellation aborted. Details in the console',
                        duration: 'long'
                    });
                    console.log('Box cancellation aborted', error, receipt);

                    this.loadingIndicatorServ.off();
                }));
    }

    async acceptBox(box: Box, password: string): Promise<void> {

        let selectedAccount = this.selectedAccount$.getValue();
        let passHash = win.Web3.utils.soliditySha3(password);

        let baseTokenAmount = ZERO;
        if (box.request_token == ADDRESS_ZERO) {
            baseTokenAmount = box.request_value;
        }
        else {
            let isConfirmed = await this.confirmDialogServ.spawn({
                dialogName: 'Do you want to approve?',
                message: 'To accept the exchange you need to approve the requested token first. The approval is required only once per token.<br><span class="fw-bold">Do you want to approve?<span>',
                confirmButtonName: 'Approve'
            });
            if (!isConfirmed) {
                return;
            }

            // Try/catching the approveMax() to see if it's the case to stop the execution
            try {
                await this.approveMax(box.request_token);
            }
            catch (error) {
                return;
            }
        }

        this.ethboxContract.methods
            .clear_box(box.index, passHash)
            .send({
                from: selectedAccount,
                value: baseTokenAmount
            })
            .on('transactionHash', hash =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'secondary',
                        message: 'May take a while, please wait...',
                        duration: 'short'
                    });

                    this.loadingIndicatorServ.on();
                }))
            .on('receipt', receipt =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'success',
                        message: 'The box has been accepted!',
                        duration: 'long'
                    });

                    this.balanceChanged$.next(true);
                    this.loadingIndicatorServ.off();
                }))
            .on('error', (error, receipt) =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'danger',
                        message: 'Box approval aborted. Details in the console',
                        duration: 'long'
                    });
                    console.log('Box approval aborted', error, receipt);

                    this.loadingIndicatorServ.off();
                }));
    }

    signMessage(message) {

        let selectedAccount = this.selectedAccount$.getValue();

        return new Promise((resolve, reject) => {
            this.provider.sendAsync({
                method: 'personal_sign',
                params: [message, selectedAccount],
                from: selectedAccount
            }, (error, response) => {

                if (error) {
                    this.toasterServ.toastMessage$.next({
                        type: 'danger',
                        message: 'Sign of message aborted. Details in the console',
                        duration: 'long'
                    });
                    console.log('Sign of message aborted', error);
                    reject(error);
                }
                resolve(response);

            });
        });
    }

    private init(): void {

        console.log('WalletConnectProvider is', this.WalletConnectProvider);
        console.log('Fortmatic is', this.Fortmatic);
        let providerOptions = {
            walletconnect: {
                package: this.WalletConnectProvider,
                options: {
                    infuraId: this.WALLECTCONNECT_APIKEY
                }
            },
            fortmatic: {
                package: this.Fortmatic,
                options: {
                    key: this.FORTMATIC_APIKEY
                }
            }
        };

        this.web3Modal = new this.Web3Modal({
            cacheProvider: false,
            providerOptions,
            disableInjectedProvider: false
        });
        console.log('Web3Modal instance is', this.web3Modal);
    }

    private async fetchVariables(): Promise<void> {

        this.loadingIndicatorServ.on();

        let chainId = await this.web3.eth.getChainId();
        this.chainId$.next(chainId);

        let accounts = await this.web3.eth.getAccounts();
        let selectedAccount = accounts[0];
        this.selectedAccount$.next(selectedAccount);

        if (!chainId || !selectedAccount) {
            this.resetVariables();
            return;
        }

        // Sets the addresses for the contracts depending on the current chain
        // If the user is on the wrong chain, then resets and return
        if (chainId == 4) { // 4 = Rinkeby
            this.ethboxAddress = ETHBOX.ADDRESSES.RINKEBY;
            this.tokenDispenserAddress = TOKEN_DISPENSER.ADDRESSES.RINKEBY;
            this.tokensMap = this.ERC20_MAP;
            this.tokens$.next(ERC20_LIST);

            console.log('Selected chain is Rinkeby');
            console.log('Ethbox contract address is', this.ethboxAddress);
            console.log('Supported tokens are', ERC20_LIST);
        }
        else if (chainId == 97) { // 97 = BSC Testnet
            this.ethboxAddress = ETHBOX.ADDRESSES.BSC_TESTNET;
            this.tokenDispenserAddress = TOKEN_DISPENSER.ADDRESSES.BSC_TESTNET;
            this.tokensMap = this.BEP20_MAP;
            this.tokens$.next(BEP20_LIST);

            console.log('Selected chain is BSC Testnet');
            console.log('Ethbox contract address is', this.ethboxAddress);
            console.log('Supported tokens are', BEP20_LIST);
        }
        else {
            this.resetVariables();
            return;
        }

        // Instantiates the contracts
        this.ethboxContract = new this.web3.eth
            .Contract(ETHBOX.ABI, this.ethboxAddress);
        this.tokenDispenserContract = new this.web3.eth
            .Contract(TOKEN_DISPENSER.ABI, this.tokenDispenserAddress);

        // Gets the addresses for the test tokens
        this.testTokensAddresses.AAA = await this.tokenDispenserContract.methods
            .token1().call();
        this.testTokensAddresses.BBB = await this.tokenDispenserContract.methods
            .token2().call();
        this.testTokensAddresses.CCC = await this.tokenDispenserContract.methods
            .token3().call();

        // App is ready!
        this.isAppReady$.next(true);
        this.loadingIndicatorServ.off();
    }

    private resetVariables() {

        this.ethboxContract = null;
        this.tokenDispenserContract = null;
        this.tokens$.next(null);
        this.boxes$.next(null);

        this.isAppReady$.next(false);
        this.loadingIndicatorServ.off();
    }

    private async getWeiAllowance(tokenAddress: string): Promise<string> {

        let tokenContract = new this.web3.eth.Contract(ERC20_ABI, tokenAddress);

        let allowance = await tokenContract.methods
            .allowance(this.selectedAccount$.getValue(), this.ethboxAddress)
            .call({ from: this.selectedAccount$.getValue() });

        return allowance;
    }

}
