import { Encoding, Field, MerkleMap, MerkleMapWitness, Poseidon } from "o1js";

export const sbtMetadata = {
    "name": "SBT #1001",
    "description": "A SBT",
    "image": "ipfs://QmXkxpwA6go8J1iyz1s1MTigpE9Cf6yHCTmwfG9Xue3pFm/1001.png",
    "attributes": [
      {
        "trait_type": "Color",
        "value": "Blue"
      },
    ],
    "token_id": "1001",
    "token_standard": "MIP-SBT"
  }

export function flattenSBTProperties(sbtProperties: typeof sbtMetadata): Record<string, string> {
    const flattened: Record<string, string> = {};

    // Direct properties
    flattened.name = sbtProperties.name;
    flattened.description = sbtProperties.description;
    flattened.image = sbtProperties.image;
    flattened.token_id = sbtProperties.token_id;
    flattened.token_standard = sbtProperties.token_standard;

    // Flatten attributes
    sbtProperties.attributes.forEach(attribute => {
        flattened[`attribute_${attribute.trait_type}`] = attribute.value;
    });

    return flattened;
}
export class SBTMetadata {
  private map: MerkleMap;

  constructor() {
    this.map = new MerkleMap();
  }

  addField(key: string, value: string) {
    this.map.set(Poseidon.hash(Encoding.stringToFields(key)), Poseidon.hash(Encoding.stringToFields(value)));
  }

  getField(key: string): Field | undefined {
    return this.map.get(Poseidon.hash(Encoding.stringToFields(key)));
  }

  getRoot(): Field {
    return this.map.getRoot();
  }

  getWitness(key: string): MerkleMapWitness {
    return this.map.getWitness(Poseidon.hash(Encoding.stringToFields(key)));
  }
}

export function constructMetadataTree(claims: {[key: string]: string}): SBTMetadata {
  const metadataTree = new SBTMetadata();
  for (const key in claims) {
      if (claims.hasOwnProperty(key) && claims[key] !== undefined) {
        metadataTree.addField(key, claims[key]!);
      }
  }
  return metadataTree;
}