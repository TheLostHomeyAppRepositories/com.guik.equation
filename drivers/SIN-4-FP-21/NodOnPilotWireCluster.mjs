import { Cluster, ZCLDataTypes } from 'zigbee-clusters';

const ATTRIBUTES = {
  mode: {
    id: 0x0000,
    manufacturerId: 0x128b,
    type: ZCLDataTypes.enum8({
      off: 0x00,
      confort: 0x01,
      eco: 0x02,
      frost_protection: 0x03,
      'confort_-1': 0x04,
      'confort_-2': 0x05,
    }),
  },
};

const COMMANDS = {
  setMode: {
    id: 0x0000,
    manufacturerId: 0x128b,
    frameControl: ['clusterSpecific', 'manufacturerSpecific', 'disableDefaultResponse'],
    args: {
      mode: ZCLDataTypes.enum8({
        off: 0x00,
        confort: 0x01,
        eco: 0x02,
        frost_protection: 0x03,
        'confort_-1': 0x04,
        'confort_-2': 0x05,
      }),
    },
  },
};

class NodOnPilotWireCluster extends Cluster {

  static get ID() {
    return 0xfc00;
  }

  static get NAME() {
    return 'pilotWire';
  }

  static get ATTRIBUTES() {
    return ATTRIBUTES;
  }

  static get COMMANDS() {
    return COMMANDS;
  }

}

Cluster.addCluster(NodOnPilotWireCluster);

export default NodOnPilotWireCluster;
