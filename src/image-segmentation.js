import React from 'react';
import $ from 'jquery';
import update from 'immutability-helper';

export default class ImageSegmentation extends React.Component {

    constructor(props) {
      let initialPolygons;

      if(props.polygons === undefined) {
        initialPolygons = [ {points: []} ];
      } else {
        initialPolygons = JSON.parse(props.polygons)
      }

      super(props);

      this.updateCanvas = this.updateCanvas.bind(this);
      this.drawPolygons = this.drawPolygons.bind(this);
      this.calculateVariables = this.calculateVariables.bind(this);
      this.record = this.record.bind(this);

      this.handleMouseMove = this.handleMouseMove.bind(this);
      this.handleReset = this.handleReset.bind(this);
      this.handleNewPolygon = this.handleNewPolygon.bind(this);

      this.updateActivePoint = this.updateActivePoint.bind(this);
      this.updateAllPoints = this.updateAllPoints.bind(this);

      this.state = {
        currentPolygon: 0,
        activePoint: null,
        polygons: initialPolygons,
        dimensions: {
          height: 500,
          width: 500
        },
      }
    }

    componentDidMount() {
      this.init();
    }

    init() {
      this.startpoint = null;
      this.startpoint = null;
      const image = new Image();
      image.src = this.props.imageUrl;
      image.onload = () => {
        this.setState({
          dimensions: {
            height: image.height,
            width: image.width
          }
        });
        this.ctx = this.canvas.getContext('2d');
        this.drawPolygons();
      }
    }

    handleReset(event) {
      event.preventDefault();
      event.stopPropagation();

      let updated_polygons = update(this.state.polygons,
        {$splice: [[this.state.currentPolygon, 1]]}
      )

      this.setState({
        polygons: updated_polygons,
        currentPolygon: null
      }, () => this.drawPolygons());
    }

    handleNewPolygon(event) {
      event.preventDefault();
      event.stopPropagation();
      this.newPolygon();
    }

    newPolygon(x, y) {
      let updated_polygons;
      if (typeof x === 'undefined') { 
        updated_polygons = update(
          this.state.polygons, 
          {$push: [{points: []}]}
        )
      } else {
        updated_polygons = update(
          this.state.polygons, 
          {$push: [{points: [{x: x, y: y}]}]}
        )
      }

      let newCurrentPolygon = updated_polygons.length - 1;

      this.setState({
        polygons: updated_polygons,
        currentPolygon: newCurrentPolygon,
        activePoint: 0
      }, () => this.drawPolygons());
    }

    newPoint(x, y, insertAt) {
      this.setState({
        polygons: update(
          this.state.polygons,
          {[this.state.currentPolygon]: 
            {points: {$splice: 
              [[insertAt, 0, {x: x, y: y}]]
            }}
          }),
        activePoint: insertAt
      }, () => this.drawPolygons())
    }

    drawPolygons() {
      this.canvas.width = this.canvas.width; //Reset canvas
      this.record();

      this.state.polygons.forEach(function(polygon) {
        this.draw(polygon);
      }, this);
    }

    record() {
      $('#data').val(JSON.stringify(this.state.polygons));
    }

    getCenter(polygon) {
      let ptc = [];
      let twicearea = 0;
      let x = 0, y = 0;
      let p1, p2, f;
      polygon.points.forEach(function(point, i) {
        ptc.push({x: point.x, y: point.y});
      });

      let first = ptc[0], last = ptc[ptc.length - 1];
      if (first.x !== last.x || first.y !== last.y) ptc.push(first);
      let nptc = ptc.length;

      for (var i = 0, j = nptc - 1; i < nptc; j = i++) {
        p1 = ptc[i];
        p2 = ptc[j];
        f = p1.x * p2.y - p2.x * p1.y;
        twicearea += f;
        x += ( p1.x + p2.x ) * f;
        y += ( p1.y + p2.y ) * f;
      }
      f = twicearea * 3;
      return {x: x / f, y: y / f};
    }

    draw(polygon) {
      if(polygon.points.length < 1) {
        return;
      }

      this.ctx.globalCompositeOperation = 'destination-over';
      this.ctx.fillStyle = 'rgb(255, 255, 255)';
      this.ctx.strokeStyle = 'rgb(255, 20, 20)';
      this.ctx.lineWidth = 1;

      this.ctx.beginPath();
      this.ctx.moveTo(polygon.points[0].x, polygon.points[0].y);

      if(polygon.points.length >= 3) {
        let c = this.getCenter(polygon);
        this.ctx.fillRect(c.x - 4, c.y - 4, 8, 8);
      }

      polygon.points.forEach(function(e, i) {
        this.ctx.fillRect(e.x - 2, e.y - 2, 4, 4);
        this.ctx.strokeRect(e.x - 2, e.y - 2, 4, 4);
        if(polygon.points.length > 1 && i > 0) {
          this.ctx.lineTo(e.x, e.y);
        }
      }, this)

      this.ctx.closePath();
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      this.ctx.fill();
      this.ctx.stroke();
    }

    updateCanvas(event) {
      let x, y;
      x = (event.pageX - $(event.target).offset().left);
      y = (event.pageY - $(event.target).offset().top);

      if(this.state.currentPolygon === null) {
        this.newPolygon(x, y);
        return false;
      }


      if (this.state.activePoint !== null) {
        this.setState({
          activePoint: null
        });
        this.startpoint = null;
        return false;
      }


      if(this.state.currentPolygon !== null) {
        let variables = this.calculateVariables(x, y);

        if(variables.activePoint === null) {
          this.newPoint(x, y, variables.insertAt);
        } else {
          this.setState({
            activePoint: variables.activePoint,
            currentPolygon: variables.currentPolygon
          }, () => this.drawPolygons());
        }
      }

    }

    calculateVariables(x, y) {
      let activePoint = null;
      let currentPolygonIndex = this.state.currentPolygon;
      let currentPolygon = this.state.polygons[this.state.currentPolygon];
      let MIN_DISTANCE = 15;

      let distances = currentPolygon.points.map(function(point, i) {
          return Math.round(Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)));
      }, this)

      distances.forEach(function(dis, index) {
        if(dis < MIN_DISTANCE) {
          activePoint = index;
        }
      }, this)

      this.state.polygons.forEach(function(e, i) {
        if(e.points.length >= 3) {
          let c = this.getCenter(e);
          let dis = Math.sqrt(Math.pow(x - c.x, 2) + Math.pow(y - c.y, 2));
          if (dis < MIN_DISTANCE) {
            activePoint = 'center';
            currentPolygonIndex = i;
            this.startpoint = {x: x, y: y};
          }
        }
      }, this)

      currentPolygon = this.state.polygons[currentPolygonIndex];
      let insertAt = currentPolygon.points.length;

      currentPolygon.points.forEach(function(e, i) {
        let lineDis;

        if (i > 1) {
          lineDis = this.dotLineLength(
              x, y,
              e.x, e.y,
              currentPolygon.points[i - 1].x, currentPolygon.points[i - 1].y,
              true
          );

          if (lineDis < (MIN_DISTANCE * 2)) {
            insertAt = i;
          }
        } 
      }, this);

      return {insertAt: insertAt, activePoint: activePoint, currentPolygon: currentPolygonIndex}
    }



    dotLineLength(x, y, x0, y0, x1, y1, o) {
        function lineLength(x, y, x0, y0) {
            return Math.sqrt((x -= x0) * x + (y -= y0) * y);
        }

        if (o && !(o = function (x, y, x0, y0, x1, y1) {
                if (!(x1 - x0)) return {x: x0, y: y};
                else if (!(y1 - y0)) return {x: x, y: y0};
                var left, tg = -1 / ((y1 - y0) / (x1 - x0));
                return {
                    x: left = (x1 * (x * tg - y + y0) + x0 * (x * -tg + y - y1)) / (tg * (x1 - x0) + y0 - y1),
                    y: tg * left - tg * x + y
                };
            }(x, y, x0, y0, x1, y1), o.x >= Math.min(x0, x1) && o.x <= Math.max(x0, x1) && o.y >= Math.min(y0, y1) && o.y <= Math.max(y0, y1))) {
            var l1 = lineLength(x, y, x0, y0), l2 = lineLength(x, y, x1, y1);
            return l1 > l2 ? l2 : l1;
        }
        else {
            var a = y0 - y1, b = x1 - x0, c = x0 * y1 - y0 * x1;
            return Math.abs(a * x + b * y + c) / Math.sqrt(a * a + b * b);
        }
    };

    handleMouseMove(e) {
      let x = (e.pageX - $(e.target).offset().left);
      let y = (e.pageY - $(e.target).offset().top);

      let sdvpoint = {x: Math.round(x), y: Math.round(y)}
      if((this.state.currentPolygon !== null) && (this.state.activePoint !== null)) {
        if (this.state.activePoint === "center") {
          this.updateAllPoints(x, y, this.startpoint, sdvpoint);
        } else {
          this.updateActivePoint(x, y);
        }
      }
    }

    updateAllPoints(x, y, start, end) {
      let points = [];
      let originalPoints = this.state.polygons[this.state.currentPolygon].points;

      points = originalPoints.map(function(e, i) {
        return {x: (end.x - start.x) + e.x, y: (end.y - start.y) + e.y}
      });


      this.startpoint = end;
      this.setState({
      polygons: update(
        this.state.polygons,
        {
          [this.state.currentPolygon]: {
            points: { $set: points }
          }
        })
      }, () => this.drawPolygons())
    }

    updateActivePoint(x, y) {
      this.setState({
        polygons: update(
          this.state.polygons,
          {
            [this.state.currentPolygon]: {
              points: {
                [this.state.activePoint]: {
                $set: {
                  x: Math.round(x), 
                  y: Math.round(y), 
                  }
                }
              }
            }
          }
        )
      }, () => this.drawPolygons())
    }


    render() {
      var canvasStyle = {
        backgroundImage: 'url(' + this.props.imageUrl + ')',
        backgroundSize: 'cover',
      };

      var buttonStyle = {
        marginRight: '14px',
        fontWeight: 'bold',
      }

      return (
        <div>
          <input type="hidden" id="data" name="data" />
          <div className="col-sm-12">
          <canvas 
            ref={canvas => this.canvas = canvas}
            height={this.state.dimensions.height} 
            width={this.state.dimensions.width} 
            style={canvasStyle} 
            onClick={this.updateCanvas}
            onMouseMove={this.handleMouseMove}
          />
          </div>
          <button style={buttonStyle} className="btn btn-info col-sm-4" onClick={this.handleReset}>Clear</button>
          <button style={buttonStyle} className="btn btn-info col-sm-4" onClick={this.handleNewPolygon}>New Polygon</button>
        </div>
      );
    }
}
