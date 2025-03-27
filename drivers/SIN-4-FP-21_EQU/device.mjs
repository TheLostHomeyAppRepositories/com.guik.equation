import { ZigBeeDevice } from 'homey-zigbeedriver';
import ZigBee from 'zigbee-clusters';

// eslint-disable-next-line import/extensions
import NodOnPilotWireCluster from './NodOnPilotWireCluster.mjs';
import MeteringCluster from './MeteringCluster.js';

const { debug } = ZigBee;

debug(true);

/**
 * > Maybe a clue to change heat mode (but I can't test because I don't have the device yet).
 * > Nodon have an other device to manage pilot wire heater but with enocean protocol.
 * > On the enocean device to change the heating mode you just have to use the same command as to turn your heater on/off, but send different values. Maybe the zigbee device works the same way:
 * > 0 for Off, 1 for Comfort, 2 for Eco, 3 for Anti-Freeze, 4 for Comfort-1 and 5 for Comfort-2.
 *
 * @see https://github.com/Koenkk/zigbee2mqtt/issues/19169#issuecomment-1750990161
 */
// "values": [["confort",1],["confort-1",4],["confort-2",5],["confort-2",3],["eco",2],["hors gel",3],["off",0]],

/**
 * Brand: NodOn
 * Product id: SIN-4-FP-21
 * EAN: 3700313925584
 */
export default class Device extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    this.enableDebug();
    this.printNode();

    this.log(`➡️ Appareil initialisé: ${this.getName()} (${this.getData().id})`);

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
      this.log('✅ Reporting automatique configuré avec succès.');
    } catch (err) {
      this.error('⚠️ Erreur lors de la configuration du reporting automatique :', err);
    }

    this.registerCapability('pilot_wire_mode', NodOnPilotWireCluster, {
      set: 'setMode',
      setParser: (value) => {
        this.setCapabilityValue('pilot_wire_mode', value); // garder l’état localement
        return { mode: value };
      }
    });

    this.registerCapability('measure_power', MeteringCluster, {
      report: 'instantaneousDemand',
      reportParser: value => {
        const power = value / 10;
        this.log(`📡 Report automatique → Puissance: ${power} W`);
        return power;
      }
    });

    this.registerCapability('meter_power', MeteringCluster, {
      report: 'currentSummationDelivered',
      reportParser: value => {
        const energy = value;
        this.log(`📊 Report automatique → Énergie: ${energy} Wh`);
        return energy;
      }
    });

    this.powerPollingInterval = setInterval(async () => {
      try {
        const res = await zclNode.endpoints[1].clusters.metering.readAttributes(['instantaneousDemand']);
        const power = res.instantaneousDemand / 10;
        this.log(`⚡ Mise à jour manuelle → Puissance: ${power} W`);
        this.setCapabilityValue('measure_power', power);
      } catch (err) {
        this.error('⚠️ Lecture manuelle puissance échouée:', err);
      }
    }, 30000); // Toutes les 30 secondes

    this.energyPollingInterval = setInterval(async () => {
      try {
        const res = await zclNode.endpoints[1].clusters.metering.readAttributes(['currentSummationDelivered']);
        const energy = res.currentSummationDelivered;
        this.log(`🔋 Mise à jour manuelle → Consommation totale: ${energy} Wh`);
        this.setCapabilityValue('meter_power', energy);
      } catch (err) {
        this.error('⚠️ Lecture manuelle énergie échouée:', err);
      }
    }, 30000); // Toutes les 30 secondes
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
