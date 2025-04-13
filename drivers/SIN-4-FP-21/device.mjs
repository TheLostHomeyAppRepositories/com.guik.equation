import { ZigBeeDevice } from 'homey-zigbeedriver';
import ZigBee from 'zigbee-clusters';

// eslint-disable-next-line import/extensions
import { getPilotWireLabel, getPilotWireShortLabel } from './PilotWireLabel.mjs';
import NodOnPilotWireCluster from './NodOnPilotWireCluster.mjs';
import MeteringCluster from './MeteringCluster.mjs';

export default class Device extends ZigBeeDevice {
  constructor(...args) {
    super(...args);
  }

  async onNodeInit({ zclNode }) {
    this.log('🚀 Starting device initialization...');

    // 🔧 Initialization and debug
    this.enableDebug();
    this.printNode();

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

    // Read energy divisor
    try {
      const attrs = await zclNode.endpoints[1].clusters.metering.readAttributes(['divisor']);
      this.energyDivisor = attrs.divisor ?? 1000;
      this.log(`🔢 Energy divisor read: ÷${this.energyDivisor}`);
    } catch (err) {
      this.error('❌ Failed to read energy divisor:', err);
      this.energyDivisor = 1000;
    }

    // 🔁 Capabilities registration
    this.registerCapability('pilot_wire_mode', NodOnPilotWireCluster, {
      set: 'setMode',
      setParser: (value) => {
        this.log(`🧭 Picker triggered with: ${value}`);
        this.setCapabilityValue('pilot_wire_mode', value);
        this.setCapabilityValue('pilot_wire_state', getPilotWireShortLabel(value));

        // Déclenche le flow simple "Quand le mode passe à ..."
        this.homey.flow.getDeviceTriggerCard('mode_changed_to').trigger(this, { mode: value });

        return { mode: value };
      }
    });

    this.registerCapability('measure_power', MeteringCluster, {
      get: 'instantaneousDemand',
      getOpts: {
        getOnStart: true,
      },
      report: 'instantaneousDemand',
      reportParser: value => {
        const power = value;
        this.log(`📡 Automatic report → Corrected power: ${power} W`);
        return power;
      }
    });

    this.registerCapability('meter_power', MeteringCluster, {
      get: 'currentSummationDelivered',
      getOpts: {
        getOnStart: true,
      },
      report: 'currentSummationDelivered',
      reportParser: value => {
        const energy = value / this.energyDivisor;
        this.log(`📊 Automatic report → Energy: ${energy} kWh`);
        return energy;
      }
    });

    // 🔁 Periodic update (polling)
    /**
     * Forces an update of power and energy capabilities to ensure they are logged in Homey Insights.
     * This is useful when no automatic report is triggered for a while.
     */
    this.updateInsights = async () => {
      try {
        const res = await zclNode.endpoints[1].clusters.metering.readAttributes(['instantaneousDemand', 'currentSummationDelivered']);

        const power = res.instantaneousDemand;
        const total = res.currentSummationDelivered;

        if (typeof power === 'number') {
          this.setCapabilityValue('measure_power', power);
          this.log(`🕒 Insight update → Power: ${power} W`);
        }

        if (typeof total === 'number') {
          this.setCapabilityValue('meter_power', total / this.energyDivisor);
          this.log(`🕒 Insight update → Total energy: ${total / this.energyDivisor} kWh`);
        }
      } catch (err) {
        this.error('⚠️ Insight update failed:', err);
      }
    };

    // Schedule updates every minute
    this.insightForceInterval = setInterval(this.updateInsights, 60000);

    // 🚀 Default startup mode
    this.log('🌿 Startup → No mode set at boot, waiting for report or user interaction.');

    this.homey.flow.getConditionCard('power_gt').registerRunListener(async (args) => {
      const current = await this.getCapabilityValue('measure_power');
      return current > args.value;
    });
    this.homey.flow.getConditionCard('power_lt').registerRunListener(async (args) => {
      const current = await this.getCapabilityValue('measure_power');
      return current < args.value;
    });
    this.homey.flow.getConditionCard('power_gte').registerRunListener(async (args) => {
      const current = await this.getCapabilityValue('measure_power');
      return current >= args.value;
    });
    this.homey.flow.getConditionCard('power_lte').registerRunListener(async (args) => {
      const current = await this.getCapabilityValue('measure_power');
      return current <= args.value;
    });
  }

  onDeleted() {
    if (this.powerPollingInterval) {
      clearInterval(this.powerPollingInterval);
    }
    if (this.energyPollingInterval) {
      clearInterval(this.energyPollingInterval);
    }
    if (this.insightForceInterval) {
      clearInterval(this.insightForceInterval);
    }
  }
}
