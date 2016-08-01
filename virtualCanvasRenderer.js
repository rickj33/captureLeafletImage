

VirtualCanvasRenderer = VirtualRenderer.extend({

    destroy : function()
    {
        this._map = null;
        L.DomUtil.remove(this._container);
        this._ctx = null;
        this._container = null;
        this.renders.length = 0;
    },

    _initContainer : function(map)
    {
        this._container = document.createElement('canvas');
        this._ctx = this._container.getContext('2d');
        var p = this.options.padding;
        var mapSize = map.getSize();
        var min = map.containerPointToLayerPoint(mapSize.multiplyBy(-p)).round();

        this._bounds = new L.Bounds(min, min.add(mapSize.multiplyBy(1 + p * 2)).round());

        var b = this._bounds;
        var container = this._container;
        var size = b.getSize();
        var m = L.Browser.retina ? 2 : 1;

        // set canvas size (also clearing it); use double size on retina
        container.width = m * size.x;
        container.height = m * size.y;
        container.style.width = size.x + 'px';
        container.style.height = size.y + 'px';

        // translate so we use the same path coordinates after canvas element moves
        this._ctx.translate(-b.min.x, -b.min.y);

    },

    _renderMap : function(renderers)
    {
        this.renders = renderers.slice(0);
        this._bounds = this._map.getBounds();
        this._renderLayers(this.renders);
        return [this._container];
    },


    _renderLayer : function(layer)
    {
        if (layer instanceof L.Path)
        {
            if (this._bounds.intersects(layer.getBounds()))
            {
                layer._updateRendererPath(this);
            }

        }
    },

    _renderLayers : function(renders)
    {

        for (var i = 0; i < renders.length; i++)
        {
            var renderer = renders[i];
            //noinspection JSUnusedLocalSymbols
            _.forOwn(renderer._layers, _.bind(function(layer, key)
            {
                this._renderLayer(layer);
            }, this));
           
        }
    },

    _updatePoly : function(layer, closed)
    {

        //noinspection LocalVariableNamingConventionJS
        var i;
        var j;
        //noinspection LocalVariableNamingConventionJS
        var len2;
        var p;
        var parts = layer._parts;
        var len = parts.length;
        var ctx = this._ctx;

        if (!len)
        {
            return;
        }
        ctx.beginPath();
        for (i = 0; i < len; i++)
        {
            for (j = 0, len2 = parts[i].length; j < len2; j++)
            {
                p = parts[i][j];
                ctx[j ? 'lineTo' : 'moveTo'](p.x, p.y);
            }
            if (closed)
            {
                ctx.closePath();
            }
        }
        this._fillStroke(ctx, layer);
    },

    _updateCircle : function(layer)
    {

        if (layer._empty())
        {
            return;
        }

        var p = layer._point;
        var ctx = this._ctx;
        var r = layer._radius;
        var s = (layer._radiusY || r) / r;

        if (s !== 1)
        {
            ctx.save();
            ctx.scale(1, s);
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y / s, r, 0, Math.PI * 2, false);

        if (s !== 1)
        {
            ctx.restore();
        }

        this._fillStroke(ctx, layer);
    },

    _fillStroke : function(ctx, layer)
    {
        var clear = this._clear;
        var options = layer.options;

        ctx.globalCompositeOperation = clear ? 'destination-out' : 'source-over';

        if (options.fill)
        {
            ctx.globalAlpha = clear ? 1 : options.fillOpacity;
            ctx.fillStyle = options.fillColor || options.color;
            ctx.fill(options.fillRule || 'evenodd');
        }

        if (options.stroke && options.weight !== 0)
        {
            ctx.globalAlpha = clear ? 1 : options.opacity;

            // if clearing shape, do it with the previously drawn line width
            //noinspection AssignmentResultUsedJS
            layer._prevWeight = ctx.lineWidth = clear ? layer._prevWeight + 1 : options.weight;

            ctx.strokeStyle = options.color;
            ctx.lineCap = options.lineCap;
            ctx.lineJoin = options.lineJoin;
            ctx.stroke();
        }
    }

});

L.CircleMarker.prototype._updateRendererPath = function(renderer)
{
    renderer._updateCircle(this);
};

L.Polygon.prototype._updateRendererPath = function(renderer)
{
    renderer._updatePoly(this, true);
};

L.Polyline.prototype._updateRendererPath = function(renderer)
{
    renderer._updatePoly(this);
};
