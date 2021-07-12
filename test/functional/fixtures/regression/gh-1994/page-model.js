import { Selector } from 'testcafe';

class PageModel {
    constructor () {
        this.header = Selector('h1');
    }

    getHeader () {
        debugger;

        return this.header;
    }
}

export default new PageModel();
