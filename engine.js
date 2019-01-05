var Engine = {};

Engine.gravity = 20;
Engine.friction = 0.5;
Engine.bodies = {};
Engine.colliders = {}
Engine.bodyCounter = 0;
Engine.colliderCounter = 0;
Engine.windowWidth = 0;
Engine.windowHeight = 0;
(() =>
{
    Engine.windowWidth = document.documentElement.clientWidth;
    Engine.windowHeight = document.documentElement.clientHeight;
    window.addEventListener("resize", function()
    {
        Engine.windowWidth = document.documentElement.clientWidth;
        Engine.windowHeight = document.documentElement.clientHeight;
        
        for (var b in Engine.bodies)
        {
            var body = Engine.bodies[b];
            if (body.position.x > Engine.windowWidth - body.width)
                body.position.x = Engine.windowWidth - body.width;
            
            if (body.position.y > Engine.windowHeight - body.height)
                body.position.y = Engine.windowHeight - body.height;
        }
        
        canvasObject.width = Engine.windowWidth;
        canvasObject.height = Engine.windowHeight;
        
        canvasObject_static.width = Engine.windowWidth;
        canvasObject_static.height = Engine.windowHeight;
        
        for (var c in Engine.colliders)
        {
            var collider = Engine.colliders[c];
            collider.position.y = Engine.windowHeight - collider.originalPositionY;
            if (collider.sprite)
                ctx_static.drawImage(collider.sprite, collider.position.x, collider.position.y);
        }
        
        Engine.ctx.viewport(0, 0, Engine.windowWidth, Engine.windowHeight);
    });
    
    const maxTickTime = 1 / 60;
    var lastUpdate = 0;
    var vertexBuffer;
    var texBuffer;
    var vertices = new Float32Array();
    var uvs = new Float32Array();
    var vloc, tloc, uLoc;
    function Run()
    {
        var now = performance.now();
        var diff = now - lastUpdate;
        if (diff > maxTickTime)
            diff = maxTickTime;
        
        ctx.clearColor(0, 0, 0, 0);
        
        if (vertices.length != Engine.bodyCounter * 12)
        {
            vertices = new Float32Array(Engine.bodyCounter * 12);
            uvs = new Float32Array(Engine.bodyCounter * 12);
        }
        
        var vertexIndex = 0;
        var uvIndex = 0;
        
        
        for (var i in Engine.fullNameCanvases)
        {
            var c = Engine.fullNameCanvases[i];
            c.currentVertexIndex = 0;
            c.currentUvIndex = 0;
        }
        
        var nameVertexIndex = 0;
        var nameUvIndex = 0;
        var nameVertices = new Float32Array(Engine.currentNameCount * 12);
        var nameUvs = new Float32Array(Engine.currentNameCount * 12);
        
        for (var b in Engine.bodies)
        {
            var body = Engine.bodies[b];
            
            // ha azt akarjuk hogy a palya szelen is legyen surlodas, akkor ki kell szedni a 2 commentet ezalatt
            if (body.position.x <= 0)
            {
                if (body.velocity.x <= 0)
                {
                    body.position.x = 0;
                    body.velocity.x = 0;
                    //body.velocity.y *= Engine.friction;
                }
                else
                    body.position.x += body.velocity.x * diff;
            }
            else if (body.position.x >= Engine.windowWidth - body.width)
            {
                if (body.velocity.x >= 0)
                {
                    body.position.x = Engine.windowWidth - body.width;
                    body.velocity.x = 0;
                    //body.velocity.y *= Engine.friction;
                }
                else
                    body.position.x += body.velocity.x * diff;
            }
            else
            {
                body.position.x += body.velocity.x * diff;
            }
            
            if (body.position.y <= 0)
            {
                if (body.velocity.y <= 0)
                {
                    body.position.y = 0;
                    body.velocity.x *= Engine.friction;
                    body.velocity.y = Engine.gravity * diff;
                }
                else
                {
                    body.velocity.y += Engine.gravity;
                    body.position.y += body.velocity.y * diff;
                }
            }
            else if (body.position.y >= Engine.windowHeight - body.height)
            {
                if (body.velocity.y > 0)
                {
                    body.position.y = Engine.windowHeight - body.height;
                    body.velocity.y = 0;
                    body.velocity.x *= Engine.friction;
                }
                else
                {
                    body.velocity.y += Engine.gravity;
                    body.position.y += body.velocity.y * diff;
                }
            }
            else
            {
                body.velocity.y += Engine.gravity;
                body.position.y += body.velocity.y * diff;
            }
            
            body.isColliding = false;
            for (var c in Engine.colliders)
            {
                var collider = Engine.colliders[c];
                
                var colliderEdgeLeft = collider.position.x;
                var colliderEdgeRight = collider.position.x + collider.width;
                var colliderEdgeTop = collider.position.y;
                var colliderEdgeBottom = collider.position.y + collider.height;
                
                var bodyEdgeLeft = body.position.x;
                var bodyEdgeRight = body.position.x + body.width;
                var bodyEdgeTop = body.position.y;
                var bodyEdgeBottom = body.position.y + body.height;
                
                var diffLeft = bodyEdgeRight - colliderEdgeLeft;
                var diffRight = colliderEdgeRight - bodyEdgeLeft;
                var diffTop = bodyEdgeBottom - colliderEdgeTop;
                var diffBottom = colliderEdgeBottom - bodyEdgeTop;
                
                if (diffLeft > 0 && diffRight > 0 && diffTop > 0 && diffBottom > 0)
                {
                    // ilyenkor van collision
                    body.isColliding = true;
                    
                    if (body.collisionMask & collider.collisionMask)
                    {
                        var collisionDirection = 0; // 0 - left, 1 - right, 2 - top, 3 - bottom
                        var min = diffLeft;
                        if (diffRight < min)
                        {
                            min = diffRight;
                            collisionDirection = 1;
                        }
                        
                        if (diffTop < min)
                        {
                            min = diffTop;
                            collisionDirection = 2;
                        }
                        
                        if (diffBottom < min)
                        {
                            min = diffBottom;
                            collisionDirection = 3;
                        }
                        
                        switch (collisionDirection)
                        {
                            case 0: // left
                                body.position.x = colliderEdgeLeft - body.width;
                                body.velocity.x = 0;
                                break;
                            case 1: // right
                                body.position.x = colliderEdgeRight;
                                body.velocity.x = 0;
                                break;
                            case 2: // top
                                body.position.y = colliderEdgeTop - body.height;
                                body.velocity.y = 0;
                                body.velocity.x *= Engine.friction;
                                break;
                            case 3: // bottom
                                body.position.y = colliderEdgeBottom;
                                body.velocity.y = 0;
                                break;
                        }
                    }
                }
            }
            
            var left = (body.position.x | 0) / Engine.windowWidth * 2 - 1;
            var right = ((body.position.x + 32) | 0) / Engine.windowWidth * 2 - 1;
            var bottom = 1 - (body.position.y | 0) / Engine.windowHeight * 2;
            var top = 1 - ((body.position.y + 32) | 0) / Engine.windowHeight * 2;
            
            vertices[vertexIndex++] = left;
            vertices[vertexIndex++] = bottom;
            vertices[vertexIndex++] = right;
            vertices[vertexIndex++] = bottom;
            vertices[vertexIndex++] = left;
            vertices[vertexIndex++] = top;
            
            vertices[vertexIndex++] = right;
            vertices[vertexIndex++] = bottom;
            vertices[vertexIndex++] = left;
            vertices[vertexIndex++] = top;
            vertices[vertexIndex++] = right;
            vertices[vertexIndex++] = top;
            
            
            var uvLeft = (body.spriteIndex & 3) * 0.25;
            var uvRight = uvLeft + 0.25;
            var uvTop = (body.spriteIndex >> 2) / 6;
            var uvBottom = uvTop + 1 / 6;
            
            uvs[uvIndex++] = uvLeft;
            uvs[uvIndex++] = uvTop;
            uvs[uvIndex++] = uvRight;
            uvs[uvIndex++] = uvTop;
            uvs[uvIndex++] = uvLeft;
            uvs[uvIndex++] = uvBottom;
            
            uvs[uvIndex++] = uvRight;
            uvs[uvIndex++] = uvTop;
            uvs[uvIndex++] = uvLeft;
            uvs[uvIndex++] = uvBottom;
            uvs[uvIndex++] = uvRight;
            uvs[uvIndex++] = uvBottom;
            
            var nameLeft = ((body.position.x - body.text.textureWidth / 2 + 16) | 0) / Engine.windowWidth * 2 - 1;
            var nameRight = ((body.position.x + body.text.textureWidth - body.text.textureWidth / 2 + 16) | 0) / Engine.windowWidth * 2 - 1;
            var nameBottom = 1 - ((body.position.y + body.text.y_offset) | 0) / Engine.windowHeight * 2;
            var nameTop = 1 - ((body.position.y + body.text.y_offset + body.text.textureHeight) | 0) / Engine.windowHeight * 2;
            
            var nameUvLeft = body.text.texturePositionX / Engine.nameCacheCanvasSize;
            var nameUvRight = nameUvLeft + body.text.textureWidth / Engine.nameCacheCanvasSize;
            var nameUvTop = body.text.texturePositionY / Engine.nameCacheCanvasSize;
            var nameUvBottom = nameUvTop + body.text.textureHeight / Engine.nameCacheCanvasSize;
            
            if (body.text.nameCanvasId in Engine.fullNameCanvases)
            {
                var currentCanvas = Engine.fullNameCanvases[body.text.nameCanvasId];
                var currentVertices = currentCanvas.vertexBuffer;
                var currentUvs = currentCanvas.uvBuffer;
                currentVertices[currentCanvas.currentVertexIndex++] = nameLeft;
                currentVertices[currentCanvas.currentVertexIndex++] = nameBottom;
                currentVertices[currentCanvas.currentVertexIndex++] = nameRight;
                currentVertices[currentCanvas.currentVertexIndex++] = nameBottom;
                currentVertices[currentCanvas.currentVertexIndex++] = nameLeft;
                currentVertices[currentCanvas.currentVertexIndex++] = nameTop;
                
                currentVertices[currentCanvas.currentVertexIndex++] = nameRight;
                currentVertices[currentCanvas.currentVertexIndex++] = nameBottom;
                currentVertices[currentCanvas.currentVertexIndex++] = nameLeft;
                currentVertices[currentCanvas.currentVertexIndex++] = nameTop;
                currentVertices[currentCanvas.currentVertexIndex++] = nameRight;
                currentVertices[currentCanvas.currentVertexIndex++] = nameTop;
                
                currentUvs[currentCanvas.currentUvIndex++] = nameUvLeft;
                currentUvs[currentCanvas.currentUvIndex++] = nameUvTop;
                currentUvs[currentCanvas.currentUvIndex++] = nameUvRight;
                currentUvs[currentCanvas.currentUvIndex++] = nameUvTop;
                currentUvs[currentCanvas.currentUvIndex++] = nameUvLeft;
                currentUvs[currentCanvas.currentUvIndex++] = nameUvBottom;
                
                currentUvs[currentCanvas.currentUvIndex++] = nameUvRight;
                currentUvs[currentCanvas.currentUvIndex++] = nameUvTop;
                currentUvs[currentCanvas.currentUvIndex++] = nameUvLeft;
                currentUvs[currentCanvas.currentUvIndex++] = nameUvBottom;
                currentUvs[currentCanvas.currentUvIndex++] = nameUvRight;
                currentUvs[currentCanvas.currentUvIndex++] = nameUvBottom;
            }
            else
            {
                nameVertices[nameVertexIndex++] = nameLeft;
                nameVertices[nameVertexIndex++] = nameBottom;
                nameVertices[nameVertexIndex++] = nameRight;
                nameVertices[nameVertexIndex++] = nameBottom;
                nameVertices[nameVertexIndex++] = nameLeft;
                nameVertices[nameVertexIndex++] = nameTop;
                
                nameVertices[nameVertexIndex++] = nameRight;
                nameVertices[nameVertexIndex++] = nameBottom;
                nameVertices[nameVertexIndex++] = nameLeft;
                nameVertices[nameVertexIndex++] = nameTop;
                nameVertices[nameVertexIndex++] = nameRight;
                nameVertices[nameVertexIndex++] = nameTop;
                
                nameUvs[nameUvIndex++] = nameUvLeft;
                nameUvs[nameUvIndex++] = nameUvTop;
                nameUvs[nameUvIndex++] = nameUvRight;
                nameUvs[nameUvIndex++] = nameUvTop;
                nameUvs[nameUvIndex++] = nameUvLeft;
                nameUvs[nameUvIndex++] = nameUvBottom;
                
                nameUvs[nameUvIndex++] = nameUvRight;
                nameUvs[nameUvIndex++] = nameUvTop;
                nameUvs[nameUvIndex++] = nameUvLeft;
                nameUvs[nameUvIndex++] = nameUvBottom;
                nameUvs[nameUvIndex++] = nameUvRight;
                nameUvs[nameUvIndex++] = nameUvBottom;
            }
            
            //if (body.text)
            //{
            //    ctx.drawImage(body.text.content, body.text.texturePositionX, body.text.texturePositionY,
            //                  body.text.textureWidth, body.text.textureHeight,
            //                  (body.position.x + body.width * 0.5 - body.text.textureWidth * 0.5) | 0,
            //                  (body.position.y + body.text.y_offset - body.text.textureHeight * 0.5) | 0,
            //                  body.text.textureWidth, body.text.textureHeight);
            //}
        }
        
        if (Engine.bodyCounter != 0)
        {
            ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA);
            ctx.enableVertexAttribArray(vloc);
            ctx.bindBuffer(ctx.ARRAY_BUFFER, vertexBuffer);
            ctx.bufferData(ctx.ARRAY_BUFFER, vertices, ctx.STATIC_DRAW);
            ctx.vertexAttribPointer(vloc, 2, ctx.FLOAT, false, 0, 0);

            ctx.enableVertexAttribArray(tloc);
            ctx.bindBuffer(ctx.ARRAY_BUFFER, texBuffer);
            ctx.bufferData(ctx.ARRAY_BUFFER, uvs, ctx.STATIC_DRAW);
            ctx.bindTexture(ctx.TEXTURE_2D, Engine.spriteSheet);
            ctx.vertexAttribPointer(tloc, 2, ctx.FLOAT, false, 0, 0);

            ctx.drawArrays(ctx.TRIANGLES, 0, Engine.bodyCounter * 6);
        }
        
        ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA);
        if (Engine.currentNameCount != 0)
        {
            ctx.enableVertexAttribArray(vloc);
            ctx.bindBuffer(ctx.ARRAY_BUFFER, vertexBuffer);
            ctx.bufferData(ctx.ARRAY_BUFFER, nameVertices, ctx.STATIC_DRAW);
            ctx.vertexAttribPointer(vloc, 2, ctx.FLOAT, false, 0, 0);

            ctx.enableVertexAttribArray(tloc);
            ctx.bindBuffer(ctx.ARRAY_BUFFER, texBuffer);
            ctx.bufferData(ctx.ARRAY_BUFFER, nameUvs, ctx.STATIC_DRAW);
            ctx.bindTexture(ctx.TEXTURE_2D, Engine.nameTexture);
            ctx.vertexAttribPointer(tloc, 2, ctx.FLOAT, false, 0, 0);

            ctx.drawArrays(ctx.TRIANGLES, 0, Engine.currentNameCount * 6);
        }
        
        for (var i in Engine.fullNameCanvases)
        {
            var c = Engine.fullNameCanvases[i];
            ctx.enableVertexAttribArray(vloc);
            ctx.bindBuffer(ctx.ARRAY_BUFFER, vertexBuffer);
            ctx.bufferData(ctx.ARRAY_BUFFER, c.vertexBuffer, ctx.STATIC_DRAW);
            ctx.vertexAttribPointer(vloc, 2, ctx.FLOAT, false, 0, 0);

            ctx.enableVertexAttribArray(tloc);
            ctx.bindBuffer(ctx.ARRAY_BUFFER, texBuffer);
            ctx.bufferData(ctx.ARRAY_BUFFER, c.uvBuffer, ctx.STATIC_DRAW);
            ctx.bindTexture(ctx.TEXTURE_2D, c.texture);
            ctx.vertexAttribPointer(tloc, 2, ctx.FLOAT, false, 0, 0);

            ctx.drawArrays(ctx.TRIANGLES, 0, c.count * 6);
        }
        
        window.requestAnimationFrame(Run);
    }
    
    function WebglInit()
    {
        var vertexShader = `
            attribute vec2 aVertex;
            attribute vec2 aUV;
            varying vec2 vTex;
            uniform vec2 pos;
            void main()
            {
                gl_Position = vec4(aVertex + pos, 0.0, 1.0);
                vTex = aUV;
            }
        `;

        var fragmentShader = `
            precision mediump float;
            varying vec2 vTex;
            uniform sampler2D sampler0;
            void main()
            {
                gl_FragColor = texture2D(sampler0, vTex);
            }
        `;
        
        ctx.enable(ctx.BLEND);
        var vertShaderObj = ctx.createShader(ctx.VERTEX_SHADER);
        var fragShaderObj = ctx.createShader(ctx.FRAGMENT_SHADER);
        ctx.shaderSource(vertShaderObj, vertexShader);
        ctx.shaderSource(fragShaderObj, fragmentShader);
        ctx.compileShader(vertShaderObj);
        ctx.compileShader(fragShaderObj);

        var program = ctx.createProgram();
        ctx.attachShader(program, vertShaderObj);
        ctx.attachShader(program, fragShaderObj);

        ctx.linkProgram(program);
        ctx.useProgram(program);

        vertexBuffer = ctx.createBuffer();
        texBuffer = ctx.createBuffer();
        
        vloc = ctx.getAttribLocation(program, "aVertex"); 
        tloc = ctx.getAttribLocation(program, "aUV");
        uLoc = ctx.getUniformLocation(program, "pos");

        ctx.viewport(0, 0, Engine.windowWidth, Engine.windowHeight);
        
        Engine.nameTexture = ctx.createTexture();
        ctx.bindTexture(ctx.TEXTURE_2D, Engine.nameTexture);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
    }
    
    var canvasObject;
    var ctx;
    var canvasObject_static;
    var ctx_static;
    function Initialize()
    {
        canvasObject = document.createElement("canvas");
        document.getElementsByTagName("body")[0].appendChild(canvasObject);
        ctx = canvasObject.getContext("webgl");
        canvasObject.width = Engine.windowWidth;
        canvasObject.height = Engine.windowHeight;
        canvasObject.style = "position: absolute; top: 0px; left: 0px; z-index: 0;";
        
        canvasObject_static = document.createElement("canvas");
        document.getElementsByTagName("body")[0].appendChild(canvasObject_static);
        ctx_static = canvasObject_static.getContext("2d");
        canvasObject_static.width = Engine.windowWidth;
        canvasObject_static.height = Engine.windowHeight;
        canvasObject_static.style = "position: absolute; top: 0px; left: 0px; z-index: -1;";
        
        Engine.ctx = ctx;
        Engine.ctx_static = ctx_static;
        ctx.textAlign = "center";
        
        WebglInit();
    }
    
    Initialize();
    window.requestAnimationFrame(Run);
})();

Engine.addBody = function(body)
{
    if (!body || !body.width || !body.height)
    {
        throw "Body must exist and must have width and height set";
        return;
    }
    
    var id;
    if (body.isStatic)
    {
        id = Engine.colliderCounter++;
        Engine.colliders[id] = body;
    }
    else
    {
        id = Engine.bodyCounter++;
        Engine.bodies[id] = body;
    }
    
    body.id = id;
    
    if (body.collisionMask === undefined)
        body.collisionMask = 0;
    
    if (!body.position)
    {
        body.position =
        {
            x: Engine.windowWidth / 2,
            y: Engine.windowHeight / 2
        };
    }
    else
    {
        if (!body.position.x)
            body.position.x = Engine.windowWidth / 2;
        
        if (!body.position.y)
            body.position.y = Engine.windowHeight / 2;
        
        if (body.isStatic)
            body.originalPositionY = Engine.windowHeight - body.position.y;
    }
    
    if (body.isStatic && body.sprite)
        Engine.ctx_static.drawImage(body.sprite, body.position.x, body.position.y);
    
    if (!body.velocity)
    {
        body.velocity =
        {
            x: 0,
            y: 0
        };
    }
    else
    {
        if (!body.velocity.x)
            body.velocity.x = 0;
        
        if (!body.velocity.y)
            body.velocity.y = 0;
    }
    
    body.isColliding = false;
    
    return id;
}

Engine.applyForce = function(body, x, y)
{
    if (x === undefined)
        x = 0;
    
    if (y === undefined)
        y = 0;
    
    body.velocity.x += x;
    body.velocity.y += y;
}

Engine.fullNameCanvases = {};
Engine.addFullNameCanvas = function(canvas, id)
{
    var ctx = Engine.ctx;
    var texture = ctx.createTexture();
    ctx.bindTexture(ctx.TEXTURE_2D, texture);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
    ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, canvas);
    
    Engine.fullNameCanvases[id] =
    {
        count: Engine.currentNameCount,
        texture: texture,
        vertexBuffer: new Float32Array(Engine.currentNameCount * 12),
        uvBuffer: new Float32Array(Engine.currentNameCount * 12)
    };
    
    Engine.currentNameCount = 0;
}

Engine.currentNameCount = 0;
Engine.updateNameCanvas = function(canvas)
{
    ++Engine.currentNameCount;
    var ctx = Engine.ctx;
    ctx.bindTexture(ctx.TEXTURE_2D, Engine.nameTexture);
    ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, canvas);
}

Engine.loadSpriteSheet = function(spriteSheet)
{
    var ctx = Engine.ctx;
    Engine.spriteSheet = ctx.createTexture();
    ctx.bindTexture(ctx.TEXTURE_2D, Engine.spriteSheet);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
    ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, spriteSheet);
}
