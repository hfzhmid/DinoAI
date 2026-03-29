(function () {

    if (typeof Runner === "undefined" || !Runner.instance_) {
        alert("Buka chrome://dino dulu dan mulai game");
        return;
    }

    const r = Runner.instance_;
    r.restart();

    const AI = {
        enabled: true,
        bias: 0
    };

    function jump() {
        if (!r.tRex.jumping) {
            r.tRex.startJump(r.currentSpeed);
        }
    }

    function duck(on) {
        r.tRex.setDuck(on);
    }

    function willCollide(obs, frames = 50) {
        let simX = 0, simY = 0;
        let vy = r.tRex.jumping ? r.tRex.jumpVelocity : -10;
        let gravity = 0.6;

        for (let i = 0; i < frames; i++) {

            simX += r.currentSpeed;
            simY += vy;
            vy += gravity;

            let dinoX = r.tRex.xPos;
            let dinoY = r.tRex.yPos + simY;

            let obsX = obs.xPos - simX;
            let obsY = obs.yPos;

            let hit =
                dinoX < obsX + obs.width &&
                dinoX + r.tRex.config.WIDTH > obsX &&
                dinoY < obsY + obs.typeConfig.height &&
                dinoY + r.tRex.config.HEIGHT > obsY;

            if (hit) return true;
        }

        return false;
    }

    function drawTrajectory() {
        const ctx = r.canvasCtx;
        ctx.save();
        ctx.strokeStyle = "#555";
        ctx.lineWidth = 2;
        ctx.beginPath();

        let simX = 0, simY = 0;
        let vy = -10;
        let gravity = 0.6;

        ctx.moveTo(r.tRex.xPos, r.tRex.yPos);

        for (let i = 0; i < 40; i++) {
            simX += r.currentSpeed;
            simY += vy;
            vy += gravity;

            let x = r.tRex.xPos + simX;
            let y = r.tRex.yPos + simY;

            ctx.lineTo(x, y);

            if (y >= r.dimensions.HEIGHT - r.tRex.config.HEIGHT) break;
        }

        ctx.stroke();
        ctx.restore();
    }

    function getTargets() {
        return r.horizon.obstacles
            .slice(0, 3)
            .sort((a, b) => a.xPos - b.xPos);
    }

    function loop() {
        if (!AI.enabled) return;

        if (r.crashed) {
            AI.bias += 5;
            r.restart();
            return;
        }

        const targets = getTargets();
        if (targets.length === 0) return;

        drawTrajectory();

        for (let obs of targets) {

            const dist = obs.xPos + AI.bias;
            const type = obs.typeConfig.type;

            if (!willCollide(obs)) continue;

            if (type === "PTERODACTYL") {

                if (obs.yPos < 75 && dist < 150) {
                    duck(true);
                    setTimeout(() => duck(false), 120);
                    return;
                }

                if (dist < 140) {
                    jump();
                    return;
                }

            } else {
                if (dist < (130 + r.currentSpeed * 2)) {
                    jump();
                    return;
                }
            }
        }
    }

    setInterval(loop, 16);

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
            DinoAI
        </div>

        <div style="font-size:10px; margin-bottom:6px;">
        
                ============================
                 https://github.com/hfzhmid
                ============================
                
        </div>

        <div>Status : <span id="st">ON</span></div>
        <div>Speed  : <span id="sp">0</span></div>
        <div>Bias   : <span id="bs">0</span></div>
        <div>Obs    : <span id="ob">0</span></div>

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

    document.getElementById("tg").onclick = () => {
        AI.enabled = !AI.enabled;
        document.getElementById("st").textContent = AI.enabled ? "ON" : "OFF";
    };

    let d=false,ox,oy;
    panel.onmousedown=e=>{d=true;ox=e.offsetX;oy=e.offsetY;}
    document.onmousemove=e=>{
        if(d){
            panel.style.left=e.pageX-ox+"px";
            panel.style.top=e.pageY-oy+"px";
        }
    };
    document.onmouseup=()=>d=false;

    setInterval(()=>{
        document.getElementById("bs").textContent = AI.bias;
        document.getElementById("sp").textContent = r.currentSpeed.toFixed(2);
        document.getElementById("ob").textContent = r.horizon.obstacles.length;
    },100);

})();
