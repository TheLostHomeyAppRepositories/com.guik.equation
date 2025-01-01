import Homey from 'homey';
import { debug } from 'zigbee-clusters';

debug(true);

export default class NetForgeBinaireNoDon extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log(`${this.id} has been initialized.`);
  }

}
