import { ZigBeeDevice } from 'homey-zigbeedriver';
import ZigBee from 'zigbee-clusters';
import PilotWireCluster from './PilotWireCluster.mjs';

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

  async onNodeInit({ node }) {
    this.enableDebug();
    this.printNode();

    node.handleFrame = (endpointId, clusterId, frame, meta) => {
      this.log('frame data!', {
        endpointId,
        clusterId,
        frame,
        frameContent: frame instanceof Buffer ? frame.toString('utf-8') : undefined,
        meta,
      });
    };

    this.registerCapability('pilot_wire_mode', PilotWireCluster, {
      // get: 'mode',
      // getOpts: {
      //   getOnStart: true,
      //   getOnOnline: true,
      //   // pollInterval: 3_600_000, // in ms
      // },

      // report: 'mode',
      // reportParser: (report) => {
      //   this.log('> reportParser', { report });
      //   return report;
      // },
      // reportOpts: {
      //   configureAttributeReporting: {
      //     minInterval: 3600, // Minimally once every hour
      //     maxInterval: 60000, // Maximally once every ~16 hours
      //     minChange: 1,
      //   },
      // },

      set: 'setMode',
      setParser: (value) => {
        return { mode: value };
      },
    });
  }

}
