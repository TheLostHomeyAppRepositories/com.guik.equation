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
      const energy = await zclNode.endpoints[1].clusters.metering.readAttributes(['currentSummationDelivered']);
      this.log(`🔋 Consommation totale (meter_energy): ${energy.currentSummationDelivered / 1000} kWh`);
      this.setCapabilityValue('meter_energy', energy.currentSummationDelivered / 1000);
    } catch (err) {
      this.error('⚠️ Erreur meter_energy:', err);
    }

    try {
      const power = await zclNode.endpoints[1].clusters.metering.readAttributes(['instantaneousDemand']);
      this.log(`⚡ Puissance brute (instantaneousDemand): ${power.instantaneousDemand}`);
      this.setCapabilityValue('measure_power', power.instantaneousDemand / 10);
    } catch (err) {
      this.error('⚠️ Erreur measure_power:', err);
    }

    try {
      await zclNode.endpoints[1].clusters.metering.configureReporting({
        currentSummationDelivered: {
          minInterval: 60,
          maxInterval: 60,
          minChange: 0
        },
        instantaneousDemand: {
          minInterval: 60,
          maxInterval: 60,
          minChange: 0
        }
      });
      this.log('✅ Reporting automatique configuré avec succès.');
    } catch (err) {
      this.error('⚠️ Erreur lors de la configuration du reporting automatique :', err);
    }

    this.registerCapability('pilot_wire_mode', NodOnPilotWireCluster, {
      set: 'setMode',
      setParser: (value) => {
        return { mode: value };
      },
    });

    this.registerCapability('measure_power', MeteringCluster, {
      report: 'instantaneousDemand',
      reportParser: value => {
        this.log(`📡 Report brut → instantaneousDemand: ${value}`);
        return value;
      }
    });
    
    /*
    this.registerCapability('meter_energy', MeteringCluster, {
      report: 'currentSummationDelivered',
      reportParser: value => {
        const energy = value / 1000;
        this.log(`📊 Mise à jour automatique → énergie: ${energy} kWh`);
        return energy;
      }
    });
    */

    setInterval(async () => {
      try {
        const power = await this.zclNode.endpoints[1].clusters.metering.readAttributes(['instantaneousDemand']);
        const value = power.instantaneousDemand;
        this.log(`🔄 Lecture manuelle → Puissance: ${value}`);
        const formatted = value / 10;
        this.log(`📥 Mise à jour Homey → measure_power = ${formatted}`);
        this.setCapabilityValue('measure_power', formatted);
      } catch (err) {
        this.error('⚠️ Erreur de lecture manuelle puissance :', err);
      }
    }, 60000); // toutes les 60 secondes

    setInterval(async () => {
      try {
        const energy = await this.zclNode.endpoints[1].clusters.metering.readAttributes(['currentSummationDelivered']);
        const value = energy.currentSummationDelivered;
        this.log(`🔁 Lecture manuelle → Énergie: ${value} (raw), soit ${value / 1000} kWh`);
        const formatted = value / 1000;
        this.log(`📥 Mise à jour Homey → meter_energy = ${formatted}`);
        this.setCapabilityValue('meter_energy', formatted);
      } catch (err) {
        this.error('⚠️ Erreur de lecture manuelle énergie :', err);
      }
    }, 60000); // toutes les 60 secondes
  }

}
