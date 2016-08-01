ImageService = {

    createImage : function(leafletMap)
    {

        var _context = this;
        // //console.log(Object.prototype.toString.call(leafletMap).slice(8, -1));
        // //console.log('entering createImage');

        this.canvas = document.createElement('canvas');
        var dimensions = leafletMap.getSize();
        this.canvas.width = dimensions.x;
        this.canvas.height = dimensions.y;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        var layerRenders = this._buildLayersToRender(leafletMap);

        //process tile layers will  draw the tile layers on the canvas
        var hasError = false;

       return  this._processTileLayers(leafletMap, layerRenders.tileLayers).then(function()
        {
          return  _context._processNonTileLayers(leafletMap, layerRenders).then(function(finalCanvas)
            {

                return finalCanvas;

            }, function(error)
            {

            });


        });


    },

    _processNonTileLayers : function(leafletMap, layerRenders)
    {
        var _context = this;
        return new Promise(function(resolve, reject)
        {
            var virtualCanvasRender = new VirtualCanvasRenderer();
            var virtualSVGRender = new VirtualSVGRenderer();
            var vectorCanvases = virtualCanvasRender.renderMap(leafletMap, layerRenders.canvasRenderers);
            var svgCanvases = virtualSVGRender.renderMap(leafletMap, layerRenders.svgRenderers);

            try
            {
                //console.log('vector canvases count  ' + canvasesToProcess.vectorCanvases.length.toString());
                //console.log('svgCanvases canvases count  ' + canvasesToProcess.svgCanvases.length.toString());
                for (var i = 0; i < vectorCanvases.length; i++)
                {
                    _context.ctx.drawImage(vectorCanvases[i], 0, 0);
                }

                for (var x = 0; x < svgCanvases.length; x++)
                {
                    _context.ctx.drawImage(svgCanvases[x], 0, 0);
                }
            }
            catch (error)
            {
                hasError = true;
                //console.log('Error in creating image');
                reject(error);
            }
            finally
            {
                if (virtualCanvasRender.destroy)
                {
                    virtualCanvasRender.destroy();
                }

                if (virtualSVGRender.destroy)
                {
                    virtualSVGRender.destroy();
                }
                vectorCanvases = null;
                svgCanvases = null;

                if (_context.canvas)
                {
                    // L.DomUtil.remove(canvas);
                    //console.log('create image resolve with canvas');
                    resolve(_context.canvas);
                } else
                {
                    resolve(null);
                }
            }
        });
    },

    _buildLayersToRender : function(map)
    {
        var canvasRenderers = [];
        var svgRenderers = [];
        var tileLayers = [];

        map.eachLayer(function(layer)
        {
            //console.log('processing map layer ' + layer.name);
            if (layer instanceof L.TileLayer)
            {
                tileLayers.push(layer);

            } else if (layer instanceof L.Renderer)
            {
                if (layer instanceof L.Canvas)
                {
                    canvasRenderers.push(layer);
                } else if (layer instanceof L.SVG)
                {
                    svgRenderers.push(layer);
                }
            }

        }, this);

        return {
            canvasRenderers : canvasRenderers,
            svgRenderers    : svgRenderers,
            tileLayers      : tileLayers
        };
    },

    _processTileLayers : function(leafletMap, tileLayersArray)
    {
        var context = this;
        return new Promise(function(resolve, reject)
        {
            var promises = [];

            _.forEach(tileLayersArray, _.bind(function(tileLayer)
            {
                var promise = this._processTileLayer(leafletMap, tileLayer);
                if (promise)
                {
                    promises.push(promise);
                }

            }, context));

            //if there we not any tile layers then just return;
            if (promises.length === 0)
            {
                resolve(true);
            }

            Promise.all(promises).then(function()
            {
                resolve(true);
            }, function(error)
            {
                reject(error);
            });

        });
    },

    _processTileLayer : function(leafletMap, tileLayer)
    {
        var _context = this;
        return new Promise(function(resolve, reject)
        {

            if (!(tileLayer instanceof L.TileLayer ))
            {
                reject('layer is not an instance of a tile layer');
            }

            var tiles = [];
            var pixelBounds;
            var origin;
            var zoom;
            var tileSize;
            var tileRange;
            var tileCenter;
            var dimensions = leafletMap.getSize();
            var center = leafletMap.getCenter();
            var tileLayerCanvas = document.createElement('canvas');

            var orginalOpacity = _context.ctx.globalAlpha;

            zoom = Math.round(leafletMap.getZoom());
            tileLayerCanvas.width = dimensions.x;
            tileLayerCanvas.height = dimensions.y;
            leafletMap._pixelOrigin = leafletMap._getNewPixelOrigin(center);

            pixelBounds = leafletMap.getPixelBounds(center, zoom);
            origin = leafletMap.getPixelOrigin();

            //required for the tileLayer._getTilePos to return the correct position.
            tileLayer._level.origin = leafletMap.project(leafletMap.unproject(leafletMap.getPixelOrigin()), zoom).round();

            tileSize = tileLayer.options.tileSize;
            tileRange = tileLayer._pxBoundsToTileRange(pixelBounds);
            tileCenter = tileRange.getCenter();

            // the parameter passed to queue is the number of concurrent tasks which can be run.
            var tileQueue = d3.queue(3);

            for (var j = tileRange.min.y; j <= tileRange.max.y; j++)
            {
                for (var i = tileRange.min.x; i <= tileRange.max.x; i++)
                {
                    var coords = new L.Point(i, j);
                    coords.z = zoom;
                    if (!tileLayer._isValidTile(coords))
                    {
                        continue;
                    }
                    tiles.push(coords);
                }
            }

            //sort the tiles based on coords.
            tiles.sort(function(a, b)
            {
                return a.distanceTo(tileCenter) - b.distanceTo(tileCenter);
            });

            _context.ctx.globalAlpha = tileLayer.options.opacity ? tileLayer.options.opacity : orginalOpacity;

            _.forEach(tiles, _.bind(function(tilePoint)
            {
                var tilePos = tileLayer._getTilePos(tilePoint).subtract(pixelBounds.min).add(origin);
                /*  //console.log( 'original tile pos          = ' + JSON.stringify( tilePos ) )
                 //console.log( 'wrapCoords tile pos        = ' + JSON.stringify( tilePoint ) )
                 //console.log( '=============================== ' );*/

                if (tilePoint.y >= 0)
                {
                    var url = _context._addCacheString(tileLayer.getTileUrl(tilePoint));
                    tileQueue.defer(_context._loadTile, url, tilePos, tileSize, tileLayerCanvas, tileLayer);
                }

            }, _context));

            tileQueue.awaitAll(function(err, results)
            {
                if (err)
                {
                    _context.ctx.globalAlpha = orginalOpacity;
                    reject(err);
                }

                var result = results[0];
                var tileCanvas = result.canvas;
                for (var i = 0; i < results.length; i++)
                {
                    var image = results[i];
                    _context._drawTile(image, _context.ctx);

                }
                //remove from the dom so when we destroy the canvas, it wont cause a mem leak.
                L.DomUtil.remove(tileCanvas);

                _context.ctx.globalAlpha = orginalOpacity;
                resolve(true);

            }, this);

        });

    },//end of handleTileLayer method.

    _loadTile : function(url, tilePos, tileSize, canvas, tileLayer, callback)
    {
        var im = new Image();
        var opacity = tileLayer.options.opacity;
        im.crossOrigin = '';
        im.onload = function()
        {
            callback(null, {
                canvas : canvas,
                img    : this,
                pos    : tilePos,
                size   : tileSize
            });
        };
        im.src = url;
    },

    _drawTile : function(imageData, ctx)
    {
        ctx.drawImage(imageData.img, Math.floor(imageData.pos.x), Math.floor(imageData.pos.y), imageData.size, imageData.size);
    },

    _addCacheString : function(url)
    {
        return url + ((url.match(/\?/)) ? '&' : '?') + 'cache=' + (+this.ts);
    }

};

