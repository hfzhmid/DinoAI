(function () {

    const r = Runner.instance_;
    r.restart();

    const AI = {
        enabled: true,
        successes: 0,
        failures: 0
    };

    // Precise collision detection
    function getCollisionTime(obstacle, currentSpeed) {
        const dino = r.tRex;
        const dinoX = dino.xPos;
        const dinoY = dino.yPos;
        const dinoWidth = dino.config.WIDTH;
        const dinoHeight = dino.config.HEIGHT;
        
        const obsX = obstacle.xPos;
        const obsY = obstacle.yPos;
        const obsWidth = obstacle.width;
        const obsHeight = obstacle.typeConfig.height;
        
        // Calculate time until collision if no action taken
        const relativeSpeed = currentSpeed;
        const distanceToCollision = obsX - (dinoX + dinoWidth);
        
        if (distanceToCollision <= 0) return 0;
        
        const framesToCollision = distanceToCollision / relativeSpeed;
        
        // Check if we're already in collision
        const isColliding = (dinoX < obsX + obsWidth &&
                            dinoX + dinoWidth > obsX &&
                            dinoY < obsY + obsHeight &&
                            dinoY + dinoHeight > obsY);
        
        if (isColliding) return 0;
        
        return framesToCollision;
    }
    
    // Perfect jump timing based on obstacle distance and speed
    function shouldJumpPerfect(obstacle) {
        const dino = r.tRex;
        const currentSpeed = r.currentSpeed;
        
        // Distance from dino to obstacle
        const distanceToObstacle = obstacle.xPos - (dino.xPos + dino.config.WIDTH);
        
        if (distanceToObstacle <= 0) return false;
        
        // Calculate jump arc
        const jumpVelocity = -10;
        const gravity = 0.6;
        const jumpDuration = 2 * Math.abs(jumpVelocity / gravity);
        
        // Distance dino travels during jump
        const jumpDistance = currentSpeed * jumpDuration;
        
        // Calculate optimal jump point
        const optimalJumpDistance = jumpDistance * 0.4;
        
        // Perfect jump condition
        const shouldJump = distanceToObstacle <= optimalJumpDistance && 
                          distanceToObstacle > 5 &&
                          !r.tRex.jumping;
        
        return shouldJump;
    }
    
    // Perfect duck timing for pterodactyls
    function shouldDuckPerfect(obstacle) {
        const dino = r.tRex;
        const currentSpeed = r.currentSpeed;
        
        if (obstacle.typeConfig.type !== "PTERODACTYL") return false;
        
        const distanceToObstacle = obstacle.xPos - (dino.xPos + dino.config.WIDTH);
        
        // Check if pterodactyl is at duckable height
        const isAtDuckHeight = obstacle.yPos < 75;
        
        if (!isAtDuckHeight) return false;
        
        // Perfect duck timing
        const duckWindowStart = 25;
        const duckWindowEnd = 5;
        
        const shouldDuck = distanceToObstacle <= duckWindowStart && 
                          distanceToObstacle > duckWindowEnd &&
                          !r.tRex.ducking;
        
        return shouldDuck;
    }
    
    // Perform perfect action
    function performPerfectAction() {
        const obstacles = r.horizon.obstacles;
        
        if (obstacles.length === 0) return false;
        
        // Check nearest obstacle
        const nearestObstacle = obstacles[0];
        
        // Handle pterodactyls with ducking
        if (nearestObstacle.typeConfig.type === "PTERODACTYL") {
            if (shouldDuckPerfect(nearestObstacle)) {
                r.tRex.setDuck(true);
                
                // Release duck at the right time
                setTimeout(() => {
                    if (r.tRex.ducking) {
                        r.tRex.setDuck(false);
                    }
                }, 150);
                return true;
            }
        }
        
        // Handle all obstacles with jumping
        if (shouldJumpPerfect(nearestObstacle)) {
            if (!r.tRex.jumping && !r.tRex.ducking) {
                r.tRex.startJump(r.currentSpeed);
                return true;
            }
        }
        
        // Reset duck if no longer needed
        if (r.tRex.ducking && !shouldDuckPerfect(nearestObstacle)) {
            r.tRex.setDuck(false);
        }
        
        return false;
    }
    
    // Track if crash was already counted
    let crashCounted = false;
    
    // Main AI loop
    function aiLoop() {
        if (!AI.enabled) return;
        
        // Track failures on crash
        if (r.crashed && !crashCounted) {
            AI.failures++;
            crashCounted = true;
            updateStats();
            r.restart();
            return;
        }
        
        // Reset crash flag when game is running
        if (!r.crashed && crashCounted) {
            crashCounted = false;
        }
        
        // Track success (every frame without crash)
        if (!r.crashed && AI.enabled) {
            // Only count a success once per run
            if (!window.successCountedThisRun) {
                if (AI.successes === 0 || r.currentSpeed > 0) {
                    // Increment success only when we have at least one obstacle passed
                    const obstacles = r.horizon.obstacles;
                    if (obstacles.length === 0 && window.lastObstacleCount > 0) {
                        AI.successes++;
                        updateStats();
                        window.successCountedThisRun = true;
                    }
                    window.lastObstacleCount = obstacles.length;
                }
            }
        }
        
        // Reset success flag on restart
        if (r.crashed) {
            window.successCountedThisRun = false;
        }
        
        // Perform perfect action
        performPerfectAction();
    }
    
    // Better success tracking - count when game reaches high score
    let lastSpeed = 0;
    let successTracked = false;
    
    function updateStats() {
        document.getElementById("sc").textContent = AI.successes;
        document.getElementById("fl").textContent = AI.failures;
        document.getElementById("sp").textContent = r.currentSpeed.toFixed(2);
        document.getElementById("ob").textContent = r.horizon.obstacles.length;
        
        // Track success when speed increases significantly (passed obstacles)
        if (r.currentSpeed > lastSpeed + 0.5 && !r.crashed && AI.enabled) {
            if (!successTracked && r.horizon.obstacles.length === 0) {
                AI.successes++;
                successTracked = true;
                document.getElementById("sc").textContent = AI.successes;
            }
        }
        
        if (r.crashed) {
            successTracked = false;
        }
        
        lastSpeed = r.currentSpeed;
    }
    
    // Main loop
    setInterval(aiLoop, 16);
    
    // Create UI panel - original style
    const panel = document.createElement("div");
    panel.style = `
        position:fixed;
        top:20px;
        left:20px;
        background:#f7f7f7;
        color:#222;
        padding:10px 12px;
        border:2px solid #222;
        border-radius:6px;
        font-family:"Courier New", monospace;
        font-size:12px;
        z-index:999999;
        box-shadow:2px 2px 0 #222;
        user-select:none;
    `;
    
    panel.innerHTML = `
        <div style="font-weight:bold; margin-bottom:6px;">
            DinoAI v2
        </div>
        <div style="font-size:10px; margin-bottom:6px;">
            ============================
             https://github.com/hfzhmid
            ============================
        </div>
        <div>Status : <span id="st">ON</span></div>
        <div>Success : <span id="sc">0</span></div>
        <div>Failures : <span id="fl">0</span></div>
        <div>Speed : <span id="sp">0</span></div>
        <div>Obstacles : <span id="ob">0</span></div>
        <button id="tg" style="
            margin-top:6px;
            width:100%;
            background:#fff;
            border:1px solid #222;
            font-family:inherit;
            cursor:pointer;
        ">Toggle</button>
    `;
    
    document.body.appendChild(panel);
    
    // Toggle functionality
    document.getElementById("tg").onclick = () => {
        AI.enabled = !AI.enabled;
        document.getElementById("st").textContent = AI.enabled ? "ON" : "OFF";
        
        if (AI.enabled && r.crashed) {
            r.restart();
        }
    };
    
    // Drag functionality
    let dragging = false, offsetX, offsetY;
    panel.onmousedown = (e) => {
        dragging = true;
        offsetX = e.offsetX;
        offsetY = e.offsetY;
    };
    
    document.onmousemove = (e) => {
        if (dragging) {
            panel.style.left = (e.pageX - offsetX) + "px";
            panel.style.top = (e.pageY - offsetY) + "px";
        }
    };
    
    document.onmouseup = () => {
        dragging = false;
    };
    
    // Update stats every frame
    setInterval(updateStats, 100);
    
})();
