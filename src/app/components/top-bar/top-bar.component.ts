import { Component } from '@angular/core';
import { ContractService } from '../../services/contract.service';

@Component({
    selector: 'app-top-bar',
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent {

    constructor(public contractServ: ContractService) { }

}
