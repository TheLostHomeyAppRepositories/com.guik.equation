import { ZigBeeDevice } from 'homey-zigbeedriver';
import ZigBee from 'zigbee-clusters';

// eslint-disable-next-line import/extensions
import NodOnPilotWireCluster from './NodOnPilotWireCluster.mjs';
import MeteringCluster from './MeteringCluster.mjs';

const { debug } = ZigBee;

debug(true);

export default class Device extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    
    // 🔧 Initialization and debug
    this.enableDebug();
    this.printNode();

    this.powerCorrectionFactor = 1; // Modifier ici si nécessaire

    this.log(`➡️ Device initialized: ${this.getName()} (${this.getData().id})`);

    // ⚡️ Automatic reporting configuration
    try {
      await zclNode.endpoints[1].clusters.metering.configureReporting({
        currentSummationDelivered: {
          minInterval: 30,
          maxInterval: 60,
          minChange: 1
        },
        instantaneousDemand: {
          minInterval: 30,
          maxInterval: 60,
          minChange: 1
        }
      });
      this.log('✅ Automatic reporting successfully configured.');
    } catch (err) {
      this.error('⚠️ Error while configuring automatic reporting:', err);
    }

    // 🔁 Capabilities registration
    this.registerCapability('pilot_wire_mode', NodOnPilotWireCluster, {
      set: 'setMode',
      setParser: (value) => {
        if (value !== 'off') {
          this.lastKnownMode = value;
        }
        this.setCapabilityValue('pilot_wire_mode', value); // keep state locally

        const labels = {
          "eco": "Eco",
          "off": "Off",
          "confort": "Conf.",
          "confort_-1": "Conf. -1",
          "confort_-2": "Conf. -2",
          "frost_protection": "HG"
        };
        this.setCapabilityValue("pilot_wire_state", labels[value] || value);        
      }
    });

    this.registerCapability('measure_power', MeteringCluster, {
      report: 'instantaneousDemand',
      reportParser: value => {
        const power = value * this.powerCorrectionFactor;
        this.log(`📡 Automatic report → Corrected power: ${power} W`);
        return power;
      }
    });

    this.registerCapability('meter_power', MeteringCluster, {
      report: 'currentSummationDelivered',
      reportParser: value => {
        const energy = value;
        this.log(`📊 Automatic report → Energy: ${energy} Wh`);
        return energy;
      }
    });

    // 🔁 Periodic update (polling)
    this.powerPollingInterval = setInterval(async () => {
      try {
        const res = await zclNode.endpoints[1].clusters.metering.readAttributes(['instantaneousDemand']);
        const power = res.instantaneousDemand * this.powerCorrectionFactor;
        this.log(`⚡ Manual update → Corrected power: ${power} W`);
        this.setCapabilityValue('measure_power', power);
      } catch (err) {
        this.error('⚠️ Manual power read failed:', err);
      }
    }, 30000); // Every 30 seconds

    this.energyPollingInterval = setInterval(async () => {
      try {
        const res = await zclNode.endpoints[1].clusters.metering.readAttributes(['currentSummationDelivered']);
        const energy = res.currentSummationDelivered;
        this.log(`🔋 Manual update → Total consumption: ${energy} Wh`);
        this.setCapabilityValue('meter_power', energy);
      } catch (err) {
        this.error('⚠️ Manual energy read failed:', err);
      }
    }, 30000); // Every 30 seconds

    // 🚀 Default startup mode
    const defaultMode = this.getSetting('defaultStartupMode') || 'eco';
    this.log(`🌿 Startup → No active mode detected, forcing "${defaultMode}"`);
    await this.zclNode.endpoints[1].clusters.pilotWire.setMode({ mode: defaultMode });
    this.setCapabilityValue('pilot_wire_mode', defaultMode);
    this.lastKnownMode = defaultMode;

    const labels = {
      "eco": "Eco",
      "off": "Off",
      "confort": "Conf.",
      "confort_-1": "Conf. -1",
      "confort_-2": "Conf. -2",
      "frost_protection": "HG"
    };
    this.setCapabilityValue('pilot_wire_state', labels[defaultMode] || defaultMode);
  }

  onDeleted() {
    if (this.powerPollingInterval) {
      clearInterval(this.powerPollingInterval);
    }
    if (this.energyPollingInterval) {
      clearInterval(this.energyPollingInterval);
    }
  }
}
