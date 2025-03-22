import { ZigBeeDriver } from 'homey-zigbeedriver';

export default class MyDriver extends ZigBeeDriver {

  async onInit() {
    this.homey.flow
      .getActionCard('pilot-wire-mode-action')
      .registerRunListener(async (args) => {
        const { mode, device } = args;

        this.log('pilot-wire-mode-action triggered', { mode });

        device.triggerCapabilityListener('pilot_wire_mode', mode);
      });
  }

}
