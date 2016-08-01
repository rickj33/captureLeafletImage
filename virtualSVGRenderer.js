var VirtualSVGRenderer = VirtualRenderer.extend({ // jshint ignore:line

    destroy : function()
    {

        // this._map = null;
        L.DomUtil.remove(this._canvasContainer);
        this._ctx = null;
        this._canvasContainer = null;
        this.renders.length = 0;
        this._cleanUpRendererCanvases();
    },

    _cleanUpRendererCanvases : function()
    {

        for (var i = 0; i < this._rendererCanvases.length; i++)
        {
            var canvas = this._rendererCanvases[i];
            if (canvas)
            {
                if (canvas.svg)
                {
                    canvas.svg = null;
                }
                L.DomUtil.remove(canvas);
                //noinspection ReuseOfLocalVariableJS
                canvas = null;
            }
        }

        this._rendererCanvases.length = 0;
        this._rendererCanvases = null;

    },

    _initContainer : function(map)
    {

        this._canvasContainer = document.createElement('canvas');
        this._ctx = this._canvasContainer.getContext('2d');
        this._rendererCanvases = [];
        var p = this.options.padding;
        var mapSize = map.getSize();
        var min = map.containerPointToLayerPoint(mapSize.multiplyBy(-p)).round();

        this._bounds = new L.Bounds(min, min.add(mapSize.multiplyBy(1 + p * 2)).round());

        var b = this._bounds;
        var container = this._canvasContainer;
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

    _getRendererCanvas : function()
    {
        var rendererCanvas = document.createElement('canvas');
        
        rendererCanvas.width = this._canvasContainer.width;
        rendererCanvas.height = this._canvasContainer.height;
        rendererCanvas.style.width = this._canvasContainer.style.width;
        rendererCanvas.style.height = this._canvasContainer.style.height;
        var rendererCtx = rendererCanvas.getContext('2d');
        rendererCtx.translate(-this._bounds.min.x, -this._bounds.min.y);
        
        return rendererCanvas;
    },

    _renderMap : function(renderers)
    {

        this.renders = renderers.slice(0);
        this._canvgOptions = {
            ignoreMouse     : true,
            ignoreAnimation : true,
            ignoreClear     : true, //ignoreDimensions: true, //=> does not try to resize canvas
            useCORS         : true,
            log             : true
            //  ignoreDimensions : true,
            // offsetX: int => draws at a x offset
            // offsetY: int => draws at a y offset
            // scaleWidth: int => scales horizontally to width
            // scaleHeight: int => scales vertically to height
            // renderCallback: function => will call the function after the first render is completed
            // forceRedraw: function => will call the function on every frame, if it returns true, will redraw
        };

        this._renderLayers();

        for (var x = 0; x < this._rendererCanvases.length; x++)
        {
            this._ctx.drawImage(this._rendererCanvases[x], 0, 0);
        }

        return [this._canvasContainer];
        //  return this._rendererCanvases;
        //return this._canvasContainer;
    },

    _renderLayers : function()
    {
        //need to create a canvas for each of the svg renderes then combine them into a single canvas.
        for (var i = 0; i < this.renders.length; i++)
        {
            var renderer = this.renders[i];
            //noinspection LocalVariableNamingConventionJS
            var _canvas = this._getRendererCanvas();
            this._rendererCanvases.push(_canvas);
            // canvg( this._canvasContainer, renderer._canvasContainer.outerHTML, this._canvgOptions );
            canvg(_canvas, renderer._container.outerHTML, this._canvgOptions);
        }

        

        /*  for ( var x = 0; x < this._rendererCanvases.length; x++ )
         {
         var canvas = this._rendererCanvases[x];
         if (canvas)
         {
         //  this._ctx.drawImage( canvas, 0, 0 );
         }
     }*/

 }

});

