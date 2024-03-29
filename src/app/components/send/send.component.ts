import { Component, OnInit } from '@angular/core';
import { LoadingIndicatorService } from 'src/app/services/loading-indicator.service';
import { ContractService } from '../../services/contract.service';
import { ADDRESS_ZERO, ZERO } from '../../constants/various';
import BigNumber from 'bignumber.js';

@Component({
    selector: 'app-send',
    templateUrl: './send.component.html',
    styleUrls: ['./send.component.css']
})
export class SendComponent implements OnInit {

    password = '';
    recipient;
    sendTokenSelected;
    sendTokenBalance;
    sendValue;

    chainId;
    isChainSupported;
    selectedAccount;
    isAppReady;

    isButtonDisabled = true;
    buttonFunction;
    buttonMessage;

    private subscriptions = [];

    constructor(
        public contractServ: ContractService,
        public loadingIndicatorServ: LoadingIndicatorService) { }

    ngOnInit() {

        // Setting up the reactive code to load and reload boxes
        [
            this.contractServ.chainId$,
            this.contractServ.isChainSupported$,
            this.contractServ.selectedAccount$,
            this.contractServ.isAppReady$,
            this.contractServ.boxInteraction$
        ].forEach(obs => 
            this.subscriptions.push(
                obs.subscribe(() => this.syncButtonFunctionality())));
    }

    ngOnDestroy() {

        // When the component gets destroyed unsubscribe from everything to prevent memory leaks
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    // This is where the button gets its text and functionality updated
    syncButtonFunctionality() {
    
        // Updating local variables
        this.chainId = this.contractServ.chainId$.getValue();
        this.isChainSupported = this.contractServ.isChainSupported$.getValue();
        this.selectedAccount = this.contractServ.selectedAccount$.getValue();
        this.isAppReady = this.contractServ.isAppReady$.getValue();

        // Calculating a message for the user
        if (!this.chainId || !this.selectedAccount) {
            this.buttonMessage = 'Connect your wallet';
            this.buttonFunction = () => this.contractServ.connect();
            this.isButtonDisabled = false;
            return;
        }
        if (!this.isChainSupported) {
            this.buttonMessage = 'Wrong network, use Rinkeby or BSC Testnet';
            this.isButtonDisabled = true;
            return;
        }
        if (!this.isAppReady) {
            this.buttonMessage = 'Initializing the Smart Contract...';
            this.isButtonDisabled = true;
            return;
        }

        // About the token
        if (!this.sendTokenSelected) {
            this.buttonMessage = 'Choose a token';
            this.isButtonDisabled = true;
            return;
        }
        if (this.sendTokenSelected && !this.sendTokenBalance) {
            this.buttonMessage = 'Loading token balance...';
            this.isButtonDisabled = true;
            return;
        }
        // If the token is selected, the balance has been read but the user has not enough allowance
        if (this.sendTokenSelected 
        && this.sendTokenBalance.decimalAllowance == '0'
        || (new BigNumber(this.sendValue)).gt(this.sendTokenBalance.decimalAllowance)) {

            this.buttonMessage = `Approve ${this.sendTokenSelected.symbol}`;
            this.buttonFunction = () => 
                this.contractServ.approveMax(this.sendTokenSelected.address);
            this.isButtonDisabled = false;
            return;
        }

        // About the recipient
        if (!this.recipient) {
            this.buttonMessage = 'Recipient is required';
            this.isButtonDisabled = true;
            return;
        }
        if (!this.contractServ.isValidAddress(this.recipient)) {
            this.buttonMessage = 'Recipient is invalid';
            this.isButtonDisabled = true;
            return;
        }

        // About the send value
        if (!this.sendValue) {
            this.buttonMessage = 'Send amount is required';
            this.isButtonDisabled = true;
            return;
        }
        if (this.isValueInvalid(this.sendValue)) {
            this.buttonMessage = 'Send amount is invalid';
            this.isButtonDisabled = true;
            return;
        }
        if (this.isValueTooLow(this.sendValue, this.sendTokenSelected.decimals)) {
            this.buttonMessage = 'Send amount is too low';
            this.isButtonDisabled = true;
            return;
        }
        if (this.isValueTooHigh(this.sendValue, this.sendTokenBalance.decimalValue)) {
            this.buttonMessage = 'Send amount is too high';
            this.isButtonDisabled = true;
            return;
        }

        // All checks are passed
        this.buttonMessage = 'Send';
        this.buttonFunction = () => this.sendBox();
        this.isButtonDisabled = false;
    }

    isValueInvalid(value) {
        return !/^\d*\.?\d+$/.test(value);
    }

    isValueTooLow(value, decimals) {
        let multiplier = 1 + '0'.repeat(decimals);
        let lowestAllowedDecimal = (new BigNumber(1)).dividedBy(multiplier);
        return (new BigNumber(value)).lt(lowestAllowedDecimal);
    }

    isValueTooHigh(value, decimalValue) {
        return (new BigNumber(value)).gt(decimalValue);
    }

    sendBox() {

        this.contractServ.createBox({
            password: this.password,
            recipient: this.recipient,
            sender: this.contractServ.selectedAccount$.getValue(),
            sendTokenAddress: this.sendTokenSelected.address,
            sendDecimalValue: this.sendValue,
            requestTokenAddress: ADDRESS_ZERO,
            requestDecimalValue: ZERO
        });

        console.log('Passphrase is', this.password);
        console.log('Recipient is', this.recipient);
        console.log('Send token address is', this.sendTokenSelected.address);
        console.log('Send amount is', this.sendValue);
    }

}
