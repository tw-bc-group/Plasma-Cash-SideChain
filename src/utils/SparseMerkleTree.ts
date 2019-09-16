import BN = require("bn.js");
import utils = require("web3-utils");

/**
 *
 */
export class SparseMerkleTree {

    private depth: number;
    private leaves: Map<string, string>;
    private tree: Array<Map<string, string>>;
    public root: string;


    constructor(depth: number, leaves: any) {
        // Leaves must be a dictionary with key as the leaf's slot and value the leaf's hash
        this.leaves = new Map(Object.entries(leaves));
        this.depth = depth;
        // Initialize defaults
        let defaultNodes: Array<string> = this.buildDefaultNodes(depth);

        if (this.leaves && this.leaves.size !== 0) {
            this.tree = this.createTree(this.leaves, this.depth, defaultNodes);
            this.root = this.tree[this.depth].get('0')!;
        } else {
            this.tree = new Array<Map<string, string>>();
            this.root = defaultNodes[this.depth];
        }
    }

    private buildDefaultNodes(depth: number): Array<string> {
        let defaultNodes = new Array<string>(depth + 1);
        defaultNodes[0] = utils.soliditySha3(0);
        for (let i = 1; i < depth + 1; i++) {
            defaultNodes[i] = utils.soliditySha3(defaultNodes[i-1], defaultNodes[i-1]);
        }
        return defaultNodes;
    }

    private createTree(leaves: Map<string, string>, depth: number, defaultNodes: Array<string>) {
        let tree: Array<Map<string, string>> = [leaves]; // all leaves that composed with [token txHash] pairs at level 0.
        let treeLevel: Map<string, string> = leaves;

        let nextLevel: Map<string, string>;
        let halfIndex: string;

        for (let level = 0; level < depth; level++) { // compute the depth (i.e. 64) levels merkle tree
            nextLevel = new Map();
            for(let [slot, hash] of treeLevel) {
            halfIndex = new BN(slot).div(new BN(2)).toString(); // compute the next level merkle tree node index, e.g. [0 txHash] [1, txHash] at level 0, then the halfIndex is 0/2=0 indexed at level 1.
            if (new BN(slot).mod(new BN(2)).isZero()) { // if the slot(tokenID) is even, then compute it and its right sibling hash together to form the next level hash
                    let coIndex: string = new BN(slot).add(new BN(1)).toString();
                    nextLevel.set(halfIndex, utils.soliditySha3(hash, treeLevel.get(coIndex) || defaultNodes[level]));
                    } else { // if the slot(tokenID) is odd, we should check its left sibling is exists or not, if missing, we compute with default hash.
                    let coIndex: string = new BN(slot).sub(new BN(1)).toString();
                    if (treeLevel.get(coIndex) === undefined) {
                        nextLevel.set(halfIndex, utils.soliditySha3(defaultNodes[level], hash));
                    }
                }
            }
            treeLevel = nextLevel; // from the level 1 to level 64-1.
            tree.push(treeLevel);
        }
        return tree; // returns [leavels, level2Hashes, level3Hashes, ..., rootHash]
    }

    createMerkleProof(slot: string) {
        let index: BN = new BN(slot);
        let proof: string = '';
        let proofBits: BN = new BN(0);
        let siblingIndex: BN;
        let siblingHash: string | undefined;
        for (let level=0; level < this.depth; level++) {
            siblingIndex = index.mod(new BN(2)).isZero() ? index.add(new BN(1)) : index.sub(new BN(1));
            index = index.div(new BN(2)); // collect hash of next level in order to prove the slot targeted txHash is included in merkle tree.

            siblingHash = this.tree[level] ? this.tree[level].get(siblingIndex.toString()) : undefined; // generate the merkle tree proof path for current slot.
            if (siblingHash) {
                proof += siblingHash.replace('0x', '');
                proofBits = proofBits.bincn(level);
            }
        }

        let buf = proofBits.toBuffer('be', 8);
        let total = Buffer.concat([buf, Buffer.from(proof, 'hex')]);
        return '0x' + total.toString('hex');
    }
}
