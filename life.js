/**
 * Created by vk on 28.10.15.
 */

/***
* Rename gen and next gen on ticks
* Remove unnecessary wrapper methods
* Process bounds better
* Better high, unhigh, toogle
* oldCell?
* Add possibility to chose pattern
* Better init and pattern read
* DayNight

* Better use of global object

* Support several canvas
* How to organize controls for several canvas?

* Hex grid
* HashLife

+ Copy pattern on grid? How not to use those duplicated for loops?
+ Asimmetrical grid not working
+ Toroidal matrix, Wrap Life
+ Align patterns to center
+ Better population and maxPopulation
+ Toroidal into cell value
***/

// Global Settings
var s = {
    DEAD: 0,
    ALIVE: 1,
    rows: 30,
    columns: 30,
    pad: 1,
    rect_width: 10,
    rect_height: 10,
    get cell_width() {
        return this.rect_width + this.pad;
    },
    get cell_height() {
        return this.rect_height + this.pad;
    },
    get grid_width() {
        return this.columns * this.cell_width + 1;
    },
    get grid_height() {
        return this.rows * this.cell_height + 1;
    },
    colors: {
        0: 'white',
        1: 'green',
        2: 'lightgreen'
    }
};

var pattern = {
	glider: [
    	[0, 1, 0],
        [0, 0, 1],
        [1, 1, 1]
    ],
    pentadecathlon: [
    	[0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
        [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
        [0, 0, 1, 0, 0, 0, 0, 1, 0, 0]
    ],
    beacon: [
        [1, 1, 0, 0],
        [1, 1, 0, 0],
        [0, 0, 1, 1],
        [0, 0, 1, 1]
    ],
    rpentomino: [
    	[0, 1, 1],
    	[1, 1, 0],
    	[0, 1, 0]
    ],
    acorn: [
        [0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0],
        [1, 1, 0, 0, 1, 1, 1]
    ]
    /*gun: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
        [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
        [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ],*/
};

// Grid - draw canvas and init context
var Grid = function (s, init) {
    this.canvas = $('<canvas/>').attr({
        width: s.grid_width,
        height: s.grid_height
    }).appendTo('#canvas').get(0);
    this.context = this.canvas.getContext('2d');
    this.create(s, init);
};

Grid.prototype = {
    create: function (s, init) {
        this.matrix = new Array(s.rows);
        for (var y = 0; y < s.rows; y += 1) {
            this.matrix[y] = new Array(s.columns);
            for (var x = 0; x < s.columns; x += 1) {
                var cell = new Cell(x, y, this.context);
                this.matrix[y][x] = cell.setValue(init());
            }
        }
    },
	import: function (p) {
    	var startX = Math.floor(s.columns / 2) - Math.floor(p[0].length / 2),
    		startY = Math.floor(s.rows / 2) - Math.floor(p.length / 2);

        for (var y = 0; y < p.length; y+=1) {
            var row = p[y];
            for (var x = 0; x < row.length; x+=1) {
                this.setCellValue(startX + x, startY + y, p[y][x]);
            }
        }
    },
    getCellByXY: function (x, y) {
        return this.matrix[y][x];
    },
    getCellValue: function (x, y) {
        return this.matrix[(s.rows + y) % s.rows][(s.columns + x) % s.columns].getValue();
    },
    setCellValue: function (x, y, value) {
        this.matrix[y][x].setValue(value);
        return this;
    },
    getCell: function (event, y) {
        if (typeof y != 'undefined') {
        	return this.getCellByXY(event, y);
        }

        var x = Math.floor((event.pageX - this.canvas.offsetLeft) / s.cell_width);
        var y = Math.floor((event.pageY - this.canvas.offsetTop) / s.cell_height);

        // TODO: find better solution
        if (x < 0) x = 0;
        if (x > s.columns - 1) x = s.columns - 1;
        if (y < 0) y = 0;
        if (y > s.rows - 1) y = s.rows - 1;

        return this.getCellByXY(x, y);
    }
};

// Life
var Life = function (grid) {
    this.grid = grid;
    this.stats = {
        generation: 0,
        population: 0,
    	maxPopulation: 0,
    };
};

Life.prototype = {
    nextGen: function () {
        var nextCell, n, self = this;
        this.calcStats();
        var nextGen = this.grid.matrix.map(function (row, y) {
            return row.map(function (cell, x) {
                nextCell = new Cell(x, y, self.grid.context);
                n = self.countNeighbours(x, y);

                if (n == 3) {
                    nextCell.setValue(s.ALIVE);
                } else if (n == 4) {
                    nextCell.setValue(cell.getValue());
                } else {
                    nextCell.setValue(s.DEAD);
                }
                self.stats.population += nextCell.getValue();

                return nextCell;
            });
        });
        this.grid.matrix = nextGen;
    },
    countNeighbours: function (x, y) {
        var n = 0;
        for (var i = -1; i <= 1; i++) {
            for (var j = -1; j <= 1; j++) {
                n += this.grid.getCellValue(x + i, y + j);
            }
        }

        return n;
    },
    calcStats: function() {
    	this.stats.generation += 1;
        if (this.stats.population > this.stats.maxPopulation) {
            this.stats.maxPopulation = this.stats.population;
        }
        this.stats.population = 0;
    }
};

//Cell object
var Cell = function (x, y, context) {
    this.x = x;
    this.y = y;
    this.rectX = s.cell_width * x + s.pad;
    this.rectY = s.cell_height * y + s.pad;
    this.context = context;
};

Cell.dead = function () {
    return 0;
};

Cell.random = function () {
    return Math.round(Math.random());
};

Cell.prototype = {
    fill: function (type) {
        this.context.fillStyle = s.colors[type];
        this.context.fillRect(this.rectX, this.rectY, s.rect_width, s.rect_height);
        return this;
    },
    highlight: function () {
        this.fill(2);
    },
    unhighlight: function () {
        this.fill(this.getValue());
    },
    getValue: function () {
        return this.value;
    },
    setValue: function (value) {
        this.value = value;
        this.fill(value);

        return this;
    },
    toggle: function () {
        (this.getValue() == s.ALIVE) ? this.setValue(s.DEAD) : this.setValue(s.ALIVE);
    }
};

// Init
var grid, life, oldCell, interval;

var init = function () {
	grid = new Grid(s, Cell.dead);
    // beacon, rpentomino, glider, pentadecathlon, acorn, gun
    //grid.import(pattern.gun);
    life = new Life(grid);
    for(var key in pattern) {
    	$('#pattern').append($("<option></option>").attr("value", key).text(key));
    }
};

// Controls events
var refreshStats = function (block, clear) {
    for(var key in block.stats) {
        if (clear) {
        	block.stats[key] = 0;
        }
    	$('#' + key).text(block.stats[key]);
    }
};

$(document).ready(function() {
    init();

    // Canvas events
    $('canvas').click(function (event) {
        grid.getCell(event).toggle();
        oldCell = null;
    });

    $('canvas').mousemove(function (event) {
        var cell = grid.getCell(event);
        oldCell && oldCell.unhighlight();

        if (cell.getValue() == s.DEAD) {
            cell && cell.highlight();
            oldCell = cell;
        }
    });

    $('canvas').mouseout(function () {
        oldCell.unhighlight();
        oldCell = null;
    });

    $('#clear').click(function () {
        refreshStats(life, true);
        clearInterval(interval);
        init();
    });

    $('#next').click(function () {
        life.nextGen();
        refreshStats(life);
    });

    $('#run').click(function () {
        interval = setInterval(function () {
            life.nextGen();
            refreshStats(life);
        }, 100);
    });

    $('#pause').click(function () {
        clearInterval(interval);
    });

    $('#pattern').change(function () {
        grid.create(s, Cell.dead);
        grid.import(pattern[$(this).val()]);
        life = new Life(grid);
        clearInterval(interval);
        refreshStats(life, true);
    });
});
