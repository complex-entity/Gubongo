var Engine = {};

Engine.gravity = 20;
Engine.friction = 0.5;
Engine.bodies = {};
Engine.colliders = {}
Engine.bodyCounter = 1;
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
    });
    
    const maxTickTime = 1 / 60;
    var lastUpdate = 0;
    function Run()
    {
        var now = performance.now();
        var diff = now - lastUpdate;
        if (diff > maxTickTime)
            diff = maxTickTime;
        
        ctx.clearRect(0, 0, Engine.windowWidth, Engine.windowHeight);
        
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
            
            ctx.drawImage(body.sprite, body.position.x | 0, body.position.y | 0);
            
            if (body.text)
            {
                ctx.drawImage(body.text.content, body.position.x + body.width / 2 - body.text.content.width / 2,
                              body.position.y + body.text.y_offset - body.text.content.height / 2);
            }
        }
        
        window.requestAnimationFrame(Run);
    }
    
    var canvasObject;
    var ctx;
    var canvasObject_static;
    var ctx_static;
    function Initialize()
    {
        canvasObject = document.createElement("canvas");
        document.getElementsByTagName("body")[0].appendChild(canvasObject);
        ctx = canvasObject.getContext("2d");
        canvasObject.width = Engine.windowWidth;
        canvasObject.height = Engine.windowHeight;
        canvasObject.style = "position: absolute; top: 0px; left: 0px; z-index: 0;";
        
        canvasObject_static = document.createElement("canvas");
        document.getElementsByTagName("body")[0].appendChild(canvasObject_static);
        ctx_static = canvasObject_static.getContext("2d");
        canvasObject_static.width = Engine.windowWidth;
        canvasObject_static.height = Engine.windowHeight;
        canvasObject_static.style = "position: absolute; top: 0px; left: 0px; z-index: -1;";
        
        Engine.ctx_static = ctx_static;
        ctx.textAlign = "center";
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
    
    var id = Engine.bodyCounter++;
    body.id = id;
    if (body.isStatic)
        Engine.colliders[id] = body;
    else
        Engine.bodies[id] = body;
    
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