(function () {

    const r = Runner.instance_;
    r.restart();

    const AI = {
        enabled: true,
        effort: 60,
        min: 10,
        max: 100,
        crashCount: 0,
        runStart: Date.now()
    };

    function reactionDelay() {
        return Math.max(0, 140 - AI.effort * 1.25);
    }

    function jump() {
        if (!r.tRex.jumping) {
            r.tRex.startJump(r.currentSpeed);
        }
    }

    function duck(on) {
        r.tRex.setDuck(on);
    }

    function ttc(obs) {
        return (obs.xPos - r.tRex.xPos) / r.currentSpeed;
    }

    function willHit(obs) {
        const t = ttc(obs);
        if (t > 2.5) return false;

        const fx = obs.xPos - r.currentSpeed * t;

        return (
            r.tRex.xPos < fx + obs.width &&
            r.tRex.xPos + r.tRex.config.WIDTH > fx
        );
    }

    function targets() {
        return r.horizon.obstacles.slice(0, 3);
    }

    function adaptOnCrash() {
        AI.crashCount++;

        const survival = Date.now() - AI.runStart;
        AI.runStart = Date.now();

        // simple adaptive pressure system
        if (AI.crashCount % 2 === 0) {
            AI.effort += 3;
        } else {
            AI.effort += 1.5;
        }

        AI.effort = Math.min(AI.max, AI.effort);
    }

    function adaptOnLive() {
        const survival = Date.now() - AI.runStart;

        if (survival > 15000) AI.effort -= 1.2;
        else if (survival > 8000) AI.effort -= 0.5;

        AI.effort = Math.max(AI.min, AI.effort);
    }

    function loop() {
        if (!AI.enabled) return;

        if (r.crashed) {
            adaptOnCrash();
            r.restart();
            return;
        }

        const obsList = targets();

        for (let obs of obsList) {

            const dist = obs.xPos - r.tRex.xPos;

            if (!willHit(obs)) continue;

            const delay = reactionDelay();

            if (obs.typeConfig.type === "PTERODACTYL") {

                if (obs.yPos < 75 && dist < 160) {
                    setTimeout(() => {
                        duck(true);
                        setTimeout(() => duck(false), 120);
                    }, delay);
                    return;
                }

                if (dist < 140) {
                    setTimeout(jump, delay);
                    return;
                }

            } else {
                if (dist < (120 + r.currentSpeed * 2.2)) {
                    setTimeout(jump, delay);
                    return;
                }
            }
        }
    }

    setInterval(loop, 16);

    // silent learning tick
    setInterval(() => {
        if (!r.crashed) adaptOnLive();
    }, 5000);

})();
