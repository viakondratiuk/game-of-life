/**
 * Created by viakondratiuk on 28.10.15.
 */

/***
* Rid of global settings
* Several canvases
* Controls

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
+ Better high, unhigh, toggle
+ oldCell?
***/

// Global Settings
var lifeId = 0;
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
var Grid = function (s, init, lifeId) {
    this.lifeId = lifeId;
    this.canvas = $('<canvas/>').attr({
        width: s.grid_width,
        height: s.grid_height
    }).appendTo('#life-' + (lifeId) + ' .canvas').get(0);
    this.context = this.canvas.getContext('2d');
    this.prevCell = null;

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
    clear: function () {
        this.matrix = new Array(s.rows);
        for (var y = 0; y < s.rows; y+=1) {
            this.matrix[y] = new Array(s.columns);
            for (var x = 0; x < s.columns; x+=1) {
                var cell = new Cell(x, y, this.context);
                this.matrix[y][x] = cell.setState(0);
            }
        }
    },
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
        var x;
        if (typeof y != 'undefined') {
        	x = event;
        } else {
            x = Math.floor((event.pageX - this.canvas.offsetLeft) / s.cell_width);
            x = Math.max(0, Math.min(s.columns - 1, x));
            y = Math.floor((event.pageY - this.canvas.offsetTop) / s.cell_height);
            y = Math.max(0, Math.min(s.rows - 1, y));
        }

        return this.getCellByXY(x, y);
    },
    dayNight: function() {
        this.matrix.map(function (row) {
            return row.map(function (cell) {
                cell.toggleState();
            });
        });
    },
    toggleCellState: function (event) {
        this.getCell(event).toggleState();
    },
    mouseenterCell: function() {
        var cell = this.getCell(event);

        if (cell.getState() == s.DEAD) {
            cell.highlight(true);
            this.prevCell = cell;
        }
    },
    mouseleaveCell: function () {
        this.prevCell && this.prevCell.highlight(false);
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
        var self = this;
        this.grid.matrix = this.grid.matrix.map(function (row, y) {
            return row.map(function (cell, x) {
                var n = self.countNeighbours(x, y),
                    state = (n == 4) ? cell.getState() : (n == 3) ? s.ALIVE : s.DEAD,
                    nextCell = new Cell(x, y, self.grid.context);

                return nextCell.setState(state);
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
var wrap = [], grid, life, interval;

var init = function () {
    var cloned = $('#template').clone();
    cloned.removeClass('hidden').data('id', lifeId).attr('id', 'life-' + (lifeId));
    cloned.appendTo('#workspace');

	grid = new Grid(s, Cell.dead, lifeId);
    // beacon, rpentomino, glider, pentadecathlon, acorn, gun
    grid.import(pattern.acorn);
    life = new Life(grid);
    for(var key in pattern) {
    	$('#life-' + (lifeId) + ' .pattern').append(
            $('<option></option>').attr('state', key).text(key)
        );
    }

    wrap.push({
        grid: grid,
        life: life,
        interval: null
    });
    lifeId+=1;
};

// Controls events
var refreshStats = function (life, clear) {
    for(var key in life.stats) {
        if (clear) {
        	life.stats[key] = 0;
        }
    	$('#life-' + (life.grid.lifeId) + ' .' + key).text(life.stats[key]);
    }
};

$(document).ready(function() {
    init();

    // Canvas events
    $('body')
        .on('click', 'canvas', function (event) {
            var idx = $(this).parents('.life').data('id');
            wrap[idx].grid.toggleCellState(event);
        })
        .on('mousemove mouseout', 'canvas', function () {
            var idx = $(this).parents('.life').data('id');
            wrap[idx].grid.mouseleaveCell(event);
        })
        .on('mousemove', 'canvas', function (event) {
            var idx = $(this).parents('.life').data('id');
            wrap[idx].grid.mouseenterCell(event);
        });


    //Global controls
    $('#g-add').on('click', function () {
        init();
    });

    $('#g-day-night').on('click', function () {
        wrap.forEach(function (item) {
            item.grid.dayNight();
        });
    });

    $('#g-clear').on('click', function () {
        wrap.forEach(function (item) {
            refreshStats(item.life, true);
            clearInterval(item.interval);
            item.grid.clear();
        });
    });

    $('#g-next').on('click', function () {
        wrap.forEach(function (item) {
            item.life.tick();
            refreshStats(item.life);
        });
    });

    $('#g-run').on('click', function () {
        wrap.forEach(function (item) {
            item.interval = setInterval(function () {
                item.life.tick();
                refreshStats(item.life);
            }, 100);
        });
    });

    $('#g-pause').on('click', function () {
        wrap.forEach(function (item) {
            clearInterval(item.interval);
        });
    });

    //Local controls
    $('body')
        .on('click', '.day-night', function () {
            var idx = $(this).parents('.life').data('id');
            wrap[idx].grid.dayNight();
        })
        .on('click', '.clear', function () {
            var idx = $(this).parents('.life').data('id');
            refreshStats(wrap[idx].life, true);
            clearInterval(wrap[idx].interval);
            wrap[idx].grid.clear();
        })
        .on('click', '.next', function () {
            var idx = $(this).parents('.life').data('id');
            wrap[idx].life.tick();
            refreshStats(wrap[idx].life);
        })
        .on('click', '.run', function () {
            var idx = $(this).parents('.life').data('id');

            wrap[idx].interval = setInterval(function () {
                wrap[idx].life.tick();
                refreshStats(wrap[idx].life);
            }, 100);
        })
        .on('click', '.pause', function () {
            var idx = $(this).parents('.life').data('id');
            clearInterval(wrap[idx].interval);
        })
        .on('change', '.pattern', function () {
            var idx = $(this).parents('.life').data('id');

            wrap[idx].grid.import(pattern[$(this).val()]);
            wrap[idx].life = new Life(wrap[idx].grid);
            clearInterval(wrap[idx].interval);
            refreshStats(wrap[idx].life, true);
        });
});
