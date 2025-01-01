import Homey from 'homey';
// import HomeyLog from 'homey-log';
import { debug } from 'zigbee-clusters';

// const { Log } = HomeyLog;

debug(true);

export default class NetForgeBinaireNoDon extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log(`${this.id} has been initialized.`);

    // this.homeyLog = new Log({ homey: this.homey });
  }

}
