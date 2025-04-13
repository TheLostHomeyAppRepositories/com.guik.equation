import { ZigBeeDriver } from 'homey-zigbeedriver';
import { getPilotWireLabel, getPilotWireShortLabel } from './PilotWireLabel.mjs';

export default class MyDriver extends ZigBeeDriver {
  onInit() {
    this.homey.flow
      .getActionCard('pilot-wire-mode-action')
      .registerRunListener(async (args) => {
        const { mode, device } = args;
        const deviceName = device.getName();
        const modeLabel = getPilotWireLabel(mode, device.homey.i18n.getLanguage());
        const modeShortLabel = getPilotWireShortLabel(mode, device.homey.i18n.getLanguage());
        device.log(`⚙️ [${deviceName}] Flow action → Setting pilot wire mode to: ${modeLabel}`);

        device.triggerCapabilityListener('pilot_wire_mode', mode);
      });

    this.homey.flow.getConditionCard('power_gt').registerRunListener(async (args) => {
      const current = await args.device.getCapabilityValue('measure_power');
      return current > args.value;
    });
    this.homey.flow.getConditionCard('power_lt').registerRunListener(async (args) => {
      const current = await args.device.getCapabilityValue('measure_power');
      return current < args.value;
    });
    this.homey.flow.getConditionCard('power_gte').registerRunListener(async (args) => {
      const current = await args.device.getCapabilityValue('measure_power');
      return current >= args.value;
    });
    this.homey.flow.getConditionCard('power_lte').registerRunListener(async (args) => {
      const current = await args.device.getCapabilityValue('measure_power');
      return current <= args.value;
    });
  }
}