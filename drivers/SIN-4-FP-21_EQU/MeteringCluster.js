import { Cluster } from 'zigbee-clusters';

export default class MeteringCluster extends Cluster {
  static get ID() {
    return 0x0702;
  }

  static get NAME() {
    return 'metering';
  }

  static get ATTRIBUTES() {
    return {
      currentSummationDelivered: { id: 0x0000, type: 'uint48' },
      instantaneousDemand: { id: 0x0400, type: 'int24' },
    };
  }
}