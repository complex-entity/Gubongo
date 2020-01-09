
// simple seeded random generator
function mulberry32(seed: number) {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

const seed = Math.random() * 2147483647 | 0;
console.log("PRNG seed: " + seed);
const rand = mulberry32(seed);

class MapGenerator {
    public width: number;
    public height: number;
    private map: Uint8Array;
    public reachableMap: Uint8Array;
    public coin: { x: number, y: number };

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;

        this.map = new Uint8Array(this.width * this.height);
        this.reachableMap = new Uint8Array(this.width * this.height);

        this.coin = { x: -1, y: -1 };
    }

    private IndexToXY(index: number) {
        return {
            x: index % this.width,
            y: index / this.width | 0
        }
    }

    private XYToIndex(x: number, y: number) {
        return y * this.width + x;
    }

    generate(topEmptyRows: number, bottomIsGround: boolean) {
        this.map.fill(0);

        let targetY;
        if (bottomIsGround) {
            targetY = this.height - 1;
            for (let i = 0; i < this.width; ++i) {
                this.map[this.XYToIndex(i, this.height - 1)] = 1;
            }
        }
        else {
            targetY = this.height;
        }

        for (let i = 0; i < this.width; ++i) {
            for (let j = topEmptyRows; j < targetY - 1; ++j) {
                this.map[this.XYToIndex(i, j)] = (rand() < 0.5) ? 1 : 0;
            }
        }

        const coinX = (rand() * (this.width - 8) | 0) + 4;
        const coinY = this.height - 4 - (rand() * 2 | 0);
        this.coin = { x: coinX, y: coinY };

        // if we use greedy method for the first check, then we'll get maps with more dirt
        this.makeReachable(rand() < 0.25);

        for (let i = 0; i < this.width; ++i) {
            for (let j = topEmptyRows; j < targetY - 1; ++j) {
                // add dirt to specific patterns
                const bottomLeftAir = !this.isAir(i, j) && !this.isAir(i + 1, j + 1) && this.isAir(i, j + 1);
                const bottomRightAir = !this.isAir(i + 1, j) && !this.isAir(i, j + 1) && this.isAir(i + 1, j + 1);
                if (bottomLeftAir || bottomRightAir) {
                    //const bottom4air = this.isAir(i, j + 2) && this.isAir(i + 1, j + 2) && this.isAir(i, j + 3) && this.isAir(i + 1, j + 3);
                    const bottom2air = this.isAir(i, j + 2) && this.isAir(i + 1, j + 2);
                    if (bottom2air) {
                        if (bottomLeftAir) {
                            this.map[this.XYToIndex(i, j + 1)] = 1;
                        }
                        else if (bottomRightAir) {
                            this.map[this.XYToIndex(i + 1, j + 1)] = 1;
                        }
                    }
                }
            }
        }

        this.makeReachable(true); // again
    }

    get Data() {
        return this.map;
    }

    get GroundMap() {
        const groundMap = new Uint8Array(this.width * this.height);

        for (let i = 0, l = this.width * this.height; i < l; ++i) {
            const { x, y } = this.IndexToXY(i);
            groundMap[i] = this.isGround(x, y) ? 1 : 0;
        }

        return groundMap;
    }

    private mapBoundsCheckX(x: number) {
        return x >= 0 && x < this.width;
    }

    private mapBoundsCheckY(y: number) {
        return y >= 0 && y < this.height;
    }

    private isGround(x: number, y: number) {
        return this.mapBoundsCheckX(x) && this.mapBoundsCheckY(y) && this.mapBoundsCheckY(y + 1)
            && this.map[this.XYToIndex(x, y)] === 0 && this.map[this.XYToIndex(x, y + 1)] === 1;
    }

    private isAir(x: number, y: number) {
        return this.mapBoundsCheckX(x) && this.mapBoundsCheckY(y) && this.map[this.XYToIndex(x, y)] === 0;
    }

    makeReachable(greedy: boolean) {
        const { x: coinX, y: coinY } = this.coin;

        // set map around the coin
        this.map[this.XYToIndex(coinX - 1, coinY)] = 0;
        this.map[this.XYToIndex(coinX + 1, coinY)] = 0;
        this.map[this.XYToIndex(coinX - 1, coinY + 1)] = 0;
        this.map[this.XYToIndex(coinX + 1, coinY + 1)] = 0;

        for (let i = coinX - 1; i <= coinX + 1; ++i) {
            this.map[this.XYToIndex(i, coinY - 1)] = 1;
        }

        for (let i = coinY - 1; i > coinY - 7; --i) {
            this.map[this.XYToIndex(coinX, i)] = 1;
        }

        this.map[this.XYToIndex(coinX, coinY)] = 0;
        this.map[this.XYToIndex(coinX, coinY + 1)] = 1;

        const checked = new Uint8Array(this.width * this.height);
        const tilesToCheck: number[] = [this.XYToIndex(coinX, coinY)];

        this.reachableMap.fill(0);
        const setReachable = (x: number, y: number) => {
            const idx = this.XYToIndex(x, y);
            // reachableFrom[idx] = 1;
            this.reachableMap[idx] = 1;
            tilesToCheck.push(idx);
        };

        // we can compare against this map to check if everything is reachable
        // if a tile is added/removed, then this map will also be changed
        const targetReachableMap = new Uint8Array(this.width * this.height);

        const floodFillRecalculate = () => {
            // everything must be reachable from the top row
            targetReachableMap.fill(1, 0, this.width);
            targetReachableMap.fill(0, this.width);
            const stack: number[] = [this.XYToIndex(coinX, coinY)];

            // flood-fill the map
            while (stack.length !== 0) {
                const current = stack.pop()!;
                if (targetReachableMap[current]) {
                    continue;
                }

                targetReachableMap[current] = 1;

                const { x, y } = this.IndexToXY(current);
                if (this.isAir(x - 1, y)) {
                    const idx = this.XYToIndex(x - 1, y);
                    stack.push(idx);
                }

                if (this.isAir(x + 1, y)) {
                    const idx = this.XYToIndex(x + 1, y);
                    stack.push(idx);
                }

                if (this.isAir(x, y - 1)) {
                    const idx = this.XYToIndex(x, y - 1);
                    stack.push(idx);
                }

                if (this.isAir(x, y + 1)) {
                    const idx = this.XYToIndex(x, y + 1);
                    stack.push(idx);
                }
            }
        };

        if (greedy) {
            floodFillRecalculate();
        }

        const possibleTilesToAddOrRemoveToMakeTheMapMoreReachable: { index: number, isAdd: boolean, weight: number }[] = [];
        const markPossiblyReachable = (x: number, y: number, isAdd: boolean, weight: number) => {
            if (x === coinX) {
                if (y === coinY || y === coinY + 1) {
                    return;
                }
            }

            const idx = this.XYToIndex(x, y);
            if (this.reachableMap[idx]) {
                return;
            }

            if (this.mapBoundsCheckX(x) && this.mapBoundsCheckY(y)) {
                possibleTilesToAddOrRemoveToMakeTheMapMoreReachable.push({ index: idx, isAdd: isAdd, weight: weight });
            }
        };

        let iterations = 0;
        while (iterations < 1000) {
            while (tilesToCheck.length !== 0) {
                const current = tilesToCheck.pop()!;
                if (checked[current]) {
                    continue;
                }
                checked[current] = 1;

                const { x, y } = this.IndexToXY(current);

                if (this.isGround(x, y)) {
                    // a ground tile is always reachable from all the air tiles above
                    for (let cy = y - 1; cy >= 0; --cy) {
                        if (this.isAir(x, cy)) {
                            setReachable(x, cy);
                        }
                        else {
                            markPossiblyReachable(x, cy, false, 0.1);
                            break;
                        }
                    }

                    if (this.isGround(x - 1, y)) {
                        // a neighbor ground tile is always reachable from an already reachable tile
                        setReachable(x - 1, y);
                    }
                    else {
                        /*
                        s is reachable from r if r is ground and the tile above r is air
                        otherwise it's not reachable
                        ∙∙∙∙∙
                        ∙∙∙s∙
                        ∙∙r██
                        █████
                        */

                        const isair = this.isAir(x - 1, y);
                        const isground = this.isGround(x - 1, y + 1);
                        if (isair && isground) {
                            setReachable(x - 1, y);
                            setReachable(x - 1, y + 1);
                        }
                        else {
                            if (!isair) {
                                markPossiblyReachable(x - 1, y, false, 1);
                            }
                            else {
                                markPossiblyReachable(x - 1, y + 2, true, 1);
                            }
                        }
                    }

                    if (this.isGround(x + 1, y)) {
                        setReachable(x + 1, y);
                    }
                    else {
                        const isair = this.isAir(x + 1, y);
                        const isground = this.isGround(x + 1, y + 1);
                        if (isair && isground) {
                            setReachable(x + 1, y);
                            setReachable(x + 1, y + 1);
                        }
                        else {
                            if (!isair) {
                                markPossiblyReachable(x + 1, y, false, 1);
                            }
                            else {
                                markPossiblyReachable(x + 1, y + 2, true, 1);
                            }
                        }
                    }
                }
                else {
                    // if air, then the tile is reachable from left/right ground tiles
                    if (this.isGround(x - 1, y)) {
                        setReachable(x - 1, y);
                    }

                    if (this.isGround(x + 1, y)) {
                        setReachable(x + 1, y);
                    }
                }
            }

            // all tiles checked, check if the entire map is reachable
            // if not, then we add/remove some tiles

            if (greedy) {
                // if the map is already reachable, then we finish early
                floodFillRecalculate();

                let allReachable = true;
                for (let i = 0; i < targetReachableMap.length; ++i) {
                    if (targetReachableMap[i] !== this.reachableMap[i]) {
                        allReachable = false;
                        break;
                    }
                }

                if (allReachable) {
                    break;
                }
            }

            const stillOkTilesToRemove: { index: number, isAdd: boolean, weight: number }[] = [];
            for (let tile of possibleTilesToAddOrRemoveToMakeTheMapMoreReachable) {
                let reachable = false;

                const { x, y } = this.IndexToXY(tile.index);
                if (this.map[tile.index]) {
                    // dirt
                    if (y > 0 && this.reachableMap[this.XYToIndex(x, y - 1)]) {
                        reachable = true;
                    }
                }
                else {
                    // air
                    if (this.reachableMap[tile.index]) {
                        reachable = true;
                    }
                }

                if (!reachable) {
                    stillOkTilesToRemove.push(tile);
                }
            }

            if (stillOkTilesToRemove.length === 0) {
                break;
            }

            let weight = 0;
            for (let i = 0; i < 1; ++i) {
                // remove or add a random tile that makes the map more reachable
                const elem = stillOkTilesToRemove[stillOkTilesToRemove.length * rand() | 0];
                const randWeight = rand();
                if (weight + elem.weight < randWeight) {
                    weight += randWeight;
                    --i;
                }
                else {
                    this.map[elem.index] = elem.isAdd ? 1 : 0;

                    weight = 0;
                }
            }
            possibleTilesToAddOrRemoveToMakeTheMapMoreReachable.length = 0;
            tilesToCheck.push(this.XYToIndex(coinX, coinY));

            checked.fill(0);
            this.reachableMap.fill(0);
            ++iterations;
        }

        // fill non-reachable tiles with dirt
        for (let i = 0, c = this.width * this.height; i < c; ++i) {
            if (this.reachableMap[i] === 0) {
                this.map[i] = 1;
            }
        }

        console.log("Map generation completed after " + iterations + " iterations");
    }
}
