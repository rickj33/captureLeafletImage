VirtualRenderer = L.Renderer.extend({ // jshint ignore:line

    options : {
        // how much to extend the clip area around the map view (relative to its size)
        // e.g. 0.1 would be 10% of map view in each direction; defaults to clip with the map view
        padding : 0
    },

    initialize : function(options)
    {
        L.setOptions(this, options);
        L.stamp(this);

    },

    renderMap : function(map, renderers)
    {
        this._map = map;

        this._initContainer(map); // defined by  implementations
        return this._renderMap(renderers);
    },

    // defined by  implementations
    destroy : function()
    {
    },
    onAdd   : L.Util.falseFn,

    onRemove : L.Util.falseFn,

    _animateZoom : L.Util.falseFn,

    _update : L.Util.falseFn,

    _initPath : L.Util.falseFn,

    _addPath : L.Util.falseFn,

    _removePath : L.Util.falseFn,

    _updatePath : L.Util.falseFn,

    _updateStyle : L.Util.falseFn,

    _requestRedraw : L.Util.falseFn,

    _redraw : L.Util.falseFn,

    _draw : L.Util.falseFn,

    getEvents : function()
    {
        return {};
    }
});