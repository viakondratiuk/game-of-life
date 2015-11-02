/**
 * Created by viakondratiuk on 28.10.15.
 */

/***
* Better high, unhigh, toogle
* oldCell?
* Better init and pattern read
* DayNight

* Better use of global object

* Support several canvas
* How to organize controls for several canvas?

* Hex grid
* HashLife

+ Copy pattern on grid? How not to use those duplicated for loops?
+ Asymmetrical grid not working
+ Toroidal matrix, Wrap Life
+ Align patterns to center
+ Better population and maxPopulation
+ Toroidal into cell state
+ Rename gen and next gen on ticks
+ Process bounds better
+ Add possibility to chose pattern
***/

// Global Settings
var s = {
    DEAD: 0,
    ALIVE: 1,
    HIGHLIGHT: 2,
    rows: 40,
    columns: 40,
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

// Grid - draw canvas and init context
var Grid = function (s, init) {
    this.canvas = $('<canvas/>').attr({
        width: s.grid_width,
        height: s.grid_height
    }).appendTo('#canvas').get(0);
    this.context = this.canvas.getContext('2d');

    this.matrix = new Array(s.rows);
    for (var y = 0; y < s.rows; y+=1) {
        this.matrix[y] = new Array(s.columns);
        for (var x = 0; x < s.columns; x+=1) {
            var cell = new Cell(x, y, this.context);
            this.matrix[y][x] = cell.setState(init());
        }
    }
};

Grid.prototype = {
	import: function (p) {
    	var startX = Math.floor(s.columns / 2) - Math.floor(p[0].length / 2),
    		startY = Math.floor(s.rows / 2) - Math.floor(p.length / 2);

        for (var y = 0; y < p.length; y+=1) {
            var row = p[y];
            for (var x = 0; x < row.length; x+=1) {
                this.setCellState(startX + x, startY + y, p[y][x]);
            }
        }
    },
    getCellByXY: function (x, y) {
        return this.matrix[(s.rows + y) % s.rows][(s.columns + x) % s.columns];
    },
    getCellState: function (x, y) {
        return this.getCellByXY(x, y).getState();
    },
    setCellState: function (x, y, state) {
        this.getCellByXY(x, y).setState(state);
        return this;
    },
    getCell: function (event, y) {
        if (typeof y != 'undefined') {
        	return this.getCellByXY(event, y);
        }

        var x = Math.floor((event.pageX - this.canvas.offsetLeft) / s.cell_width);
        var y = Math.floor((event.pageY - this.canvas.offsetTop) / s.cell_height);
        x = Math.max(0, Math.min(s.columns - 1, x));
        y = Math.max(0, Math.min(s.rows - 1, y));

        return this.getCellByXY(x, y);
    },
    dayNight: function() {
        this.matrix.map(function (row) {
            return row.map(function (cell) {
                cell.toggleState();
            });
        });
    }
};

// Life
var Life = function (grid) {
    this.grid = grid;
    this.stats = {
        generation: 0,
        population: 0,
    	maxPopulation: 0
    };
};

Life.prototype = {
    tick: function() {
        this.nextGen();
        this.calcStats();
    },
    nextGen: function () {
        var n, self = this;
        this.grid.matrix = this.grid.matrix.map(function (row, y) {
            return row.map(function (cell, x) {
                var nextCell = new Cell(x, y, self.grid.context);
                n = self.countNeighbours(x, y);

                if (n == 3) {
                    nextCell.setState(s.ALIVE);
                } else if (n == 4) {
                    nextCell.setState(cell.getState());
                } else {
                    nextCell.setState(s.DEAD);
                }
                self.stats.population += nextCell.getState();

                return nextCell;
            });
        });
    },
    countNeighbours: function (x, y) {
        var n = 0;
        for (var i = -1; i <= 1; i+=1) {
            for (var j = -1; j <= 1; j+=1) {
                n += this.grid.getCellState(x + i, y + j);
            }
        }

        return n;
    },
    calcStats: function() {
        var self = this;
    	this.stats.generation += 1;
        this.stats.population = 0;
        this.grid.matrix.map(function (row) {
            row.map(function (cell) {
                self.stats.population += cell.getState();
            });
        });
        if (this.stats.population > this.stats.maxPopulation) {
            this.stats.maxPopulation = this.stats.population;
        }
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
    highlight: function (flag) {
        (flag) ? this.fill(s.HIGHLIGHT) :  this.fill(this.getState());
    },
    getState: function () {
        return this.state;
    },
    setState: function (state) {
        this.state = state;
        this.fill(state);

        return this;
    },
    toggleState: function () {
        this.setState(1 - this.getState());
    }
};

// Init
var grid, life, oldCell, interval;

var init = function () {
	grid = new Grid(s, Cell.dead);
    // beacon, rpentomino, glider, pentadecathlon, acorn, gun
    grid.import(pattern.acorn);
    life = new Life(grid);
    for(var key in pattern) {
    	$('#pattern').append(
            $('<option></option>').attr('state', key).text(key)
        );
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
    $('canvas')
        .on('click', function(event) {
            grid.getCell(event).toggleState();
        })
        .on('mousemove mouseout', function () {
            oldCell && oldCell.highlight(false);
        })
        .on('mousemove', function (event) {
            var cell = grid.getCell(event);

            if (cell.getState() == s.DEAD) {
                cell && cell.highlight(true);
                oldCell = cell;
            }
        });

    //Controls events
    $('#clear').click(function () {
        refreshStats(life, true);
        clearInterval(interval);
        init();
    });

    $('#next').click(function () {
        life.tick();
        refreshStats(life);
    });

    $('#run').click(function () {
        interval = setInterval(function () {
            life.tick();
            refreshStats(life);
        }, 100);
    });

    $('#pause').click(function () {
        clearInterval(interval);
    });

    $('#pattern').change(function () {
        grid.import(pattern[$(this).val()]);
        life = new Life(grid);
        clearInterval(interval);
        refreshStats(life, true);
    });

    $('#add').on('click', function () {
        $('#life-1').clone('').appendTo('#template');
    });

    $('#day-night').on('click', function () {
        grid.dayNight();
    });
});
