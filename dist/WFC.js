"use strict";
class WFC {
    constructor(width, height, neighborData, tileDatas) {
        this.width = width | 0;
        this.height = height | 0;
        if (this.width < 0 || this.height < 0) {
            throw new Error("Width and height must be greater than zero");
        }
        this.length = this.width * this.height;
        this.propagating = new Set();
        this.wave = new Array(this.width * this.height);
        this.neighborCompatibilityData = {};
        for (let type in neighborData) {
            this.neighborCompatibilityData[type] = new Set();
        }
        for (let type in neighborData) {
            const others = neighborData[type];
            const current = this.neighborCompatibilityData[type];
            for (let otherType of others) {
                current.add(otherType);
                this.neighborCompatibilityData[otherType].add(type);
            }
        }
        this.tileDatas = {};
        for (let i = 0; i < tileDatas.length; ++i) {
            const current = tileDatas[i];
            this.tileDatas[current.name] = current;
        }
        this.Reset();
    }
    get Data() {
        return this.wave.map(elem => elem.values().next().value);
    }
    Reset() {
        const allTileTypes = Object.keys(this.tileDatas);
        for (let i = 0; i < this.length; ++i) {
            this.wave[i] = new Set(allTileTypes);
        }
        this.propagating.clear();
    }
    // manually set a tile
    SetConstraint(x, y, tileType) {
        const allowedTypes = typeof tileType === "string" ? [tileType] : tileType;
        for (let type of allowedTypes) {
            if (!this.tileDatas.hasOwnProperty(type)) {
                throw new Error("Tile type \"" + type + "\" does not exist in the current WFC instance");
            }
        }
        if (x < 0 || x >= this.width) {
            throw new RangeError("x must be in the range [0, " + (this.width - 1) + "] (currently x is " + x + ")");
        }
        if (y < 0 || y >= this.height) {
            throw new RangeError("y must be in the range [0, " + (this.height - 1) + "] (currently y is " + y + ")");
        }
        const currentTiles = this.wave[y * this.width + x];
        currentTiles.clear();
        for (let type of allowedTypes) {
            currentTiles.add(type);
        }
        this.propagating.add(y * this.width + x);
        this.Propagate();
    }
    Run() {
        while (true) {
            // search for the element with the lowest entropy
            let lowestEntropy = Number.MAX_SAFE_INTEGER;
            let lowestIndex = -1;
            for (let i = 0; i < this.length; ++i) {
                const current = this.wave[i];
                if (current.size !== 1) {
                    if (current.size < lowestEntropy) {
                        lowestEntropy = current.size;
                        lowestIndex = i;
                    }
                }
            }
            if (lowestIndex === -1) {
                // we're done
                break;
            }
            const selectedTile = this.wave[lowestIndex];
            const randomElement = Array.from(selectedTile)[Math.random() * selectedTile.size | 0];
            selectedTile.clear();
            selectedTile.add(randomElement);
            this.propagating.add(lowestIndex);
            this.Propagate();
        }
    }
    Propagate() {
        while (this.propagating.size !== 0) {
            const index = this.propagating.values().next().value;
            this.Collapse(index % this.width, index / this.width | 0);
        }
    }
    Collapse(x, y) {
        const index = y * this.width + x;
        if (!this.propagating.has(index)) {
            return;
        }
        this.propagating.delete(index);
        const currentTiles = this.wave[index];
        const collapse = (neighborX, neighborY, direction) => {
            const otherDirection = (direction + 2) % 4;
            const neighborIndex = neighborY * this.width + neighborX;
            const neighborTiles = this.wave[neighborIndex];
            const availableNeighborTypes = new Set();
            for (let tileType of neighborTiles) {
                availableNeighborTypes.add(this.tileDatas[tileType].edges[otherDirection]);
            }
            const allowedNeighborTypes = new Set();
            for (let tileType of currentTiles) {
                allowedNeighborTypes.add(this.tileDatas[tileType].edges[direction]);
            }
            const filteredNeighborTypes = new Set();
            for (let availableNeighborType of availableNeighborTypes) {
                for (let allowedNeighborType of allowedNeighborTypes) {
                    if (this.neighborCompatibilityData[availableNeighborType].has(allowedNeighborType)) {
                        filteredNeighborTypes.add(availableNeighborType);
                    }
                }
                ;
            }
            ;
            const incompatibleTiles = new Set();
            for (let tileType of neighborTiles) {
                const tileData = this.tileDatas[tileType];
                const neighborType = tileData.edges[otherDirection];
                if (!filteredNeighborTypes.has(neighborType))
                    incompatibleTiles.add(tileData.name);
            }
            ;
            if (neighborTiles.size === incompatibleTiles.size) {
                // contradiction
                throw new Error("Contradiction");
            }
            for (let tileType of incompatibleTiles) {
                neighborTiles.delete(tileType);
            }
            if (incompatibleTiles.size !== 0) {
                // changed, propagate changes
                this.propagating.add(neighborIndex);
            }
        };
        if (x > 0) {
            collapse(x - 1, y, 0);
        }
        if (x < this.width - 1) {
            collapse(x + 1, y, 2);
        }
        if (y > 0) {
            collapse(x, y - 1, 3);
        }
        if (y < this.height - 1) {
            collapse(x, y + 1, 1);
        }
    }
}
