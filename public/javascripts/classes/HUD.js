class HUD {
    constructor () {
        this.heartT = 0;
        this.heartUp = false;

        this.showStats = true;
        this.updateInterval = 50;
        this.hudTime = Date.now();

        this.showPlayerTab = false;

        this.crosshairSize = 25;
        this.crosshairWidth = 2;
    }

    resize() {
        let size = game.guiSize;
        if (size == 1) {
        } else if (size == 2) {

        } else if (size == 3) {
            
        }
        this.iconSize = inventory.selectorWidth*4/12;
        this.yOffset = inventory.selectorWidth+this.iconSize*1.5;
    }

    // Display player health
    displayHealth() {
        if (!initialized) return;

        if (player && player.hp <= 0) { // Player is dead
            drawRectangle(0, 0, canvas.width, canvas.height, "red", {alpha: 0.5});

            drawText("You Died!", canvas.width/2, canvas.height/3, "100px Minecraft-Regular", "white", "center", "middle")
            drawText("Press R to respawn.", canvas.width/2, canvas.height*2/3, "50px Minecraft-Regular", "white", "center", "middle")
        }

        // Draw player health
        for (let i = 0; i < 10; i++) {
            let yOffset = this.yOffset;
            if (this.heartT >= i && this.heartT < i+1 && this.heartUp) {
                yOffset += 5;
            }

            let xPos = canvas.width/2-inventory.hotboxWidth*4+i*this.iconSize;
            let yPos = canvas.height-yOffset;

            // Draw hearts based on player hp
            if (player.hp - i >= 1) {
                ctx.drawImage(full_heart, xPos, yPos, this.iconSize, this.iconSize)
            } else if (player.hp - i > 0) {
                ctx.drawImage(half_heart, xPos, yPos, this.iconSize, this.iconSize)
                this.isHalf = false;
            } else {
                ctx.drawImage(empty_heart, xPos, yPos, this.iconSize, this.iconSize)
            }
        }

        // Update heart jump animation
        if (this.heartUp) {
            this.heartT += delta*20;
            if (this.heartT > 9) {
                this.heartT = 0;
                this.heartUp = false;
            }
        }
        
    }

    // Draw hunger bar
    displayHunger() {
        for (let i = 0; i < 10; i++) {
            let xPos = canvas.width/2+inventory.hotboxWidth*4+(i-10)*this.iconSize;
            let yPos = canvas.height-this.yOffset;

            ctx.drawImage(icons, 17, 27, 8, 9, xPos, yPos, this.iconSize, this.iconSize);

            if ((player.hunger)/10 > i) {
                ctx.drawImage(icons, 53, 27, 8, 9, xPos, yPos, this.iconSize, this.iconSize);
            }
        }
    }

    // Display oxygen bar
    displayOxygen() {
        if (!player.inWater) return;

        // Draw air bubbles
        for (let i = 0; i < 10; i++) {
            let xPos = canvas.width/2+inventory.hotboxWidth*4+(-1-i)*this.iconSize;
            let yPos = canvas.height-this.yOffset-this.iconSize*1.3;

            if ((player.oxygen-2)/30 > i) {
                ctx.drawImage(icons, 17, 18, 8, 9, xPos, yPos, this.iconSize, this.iconSize);
            }  else if ((player.oxygen)/30 > i) {
                ctx.drawImage(icons, 25, 18, 8, 9, xPos, yPos, this.iconSize, this.iconSize);
            }


        }
    }

    // Display player tab list
    displayPlayerTab() {
        if (!this.showPlayerTab)
            return;

        let pad = 20;
        let top = 50;
        let width = 300+this.iconSize*11;
        let height = (Object.keys(players).length+1)*30+2*pad+20;

        let leftX = canvas.width/2-width/2+pad;
        let rightX = canvas.width/2+width/2-pad;
        let topY = top+pad;
        let healthOffset = canvas.width/2-this.iconSize*2;

        // Draw background
        drawRectangle(canvas.width/2-width/2, top, width, height, "black", {alpha: 0.5});

        // Draw title
        drawText("Username", leftX, topY, "20px Minecraft-Regular", "yellow", "left", "top")
        drawText("Health", healthOffset, topY, "20px Minecraft-Regular", "yellow", "left", "top")
        drawText("Ping", rightX, topY, "20px Minecraft-Regular", "yellow", "right", "top")

        let index = 0;
        for (let id in players) {
            let p = players[id];
            let yPos = topY+30*(index+1);

            // Draw player ping
            let ping = round(p.ping.reduce((a, b) => a + b, 0)/p.ping.length, 0) || "disc";
            drawText(ping, rightX, yPos, "20px Minecraft-Regular", "white", "right", "top")

            // Draw name
            let color = getPlayerColor(p);
            drawText(p.name, leftX, yPos, "20px Minecraft-Regular", color, "left", "top")
            let nameWidth = ctx.measureText(p.name).width;
            if (p.operator) drawText(" [admin]", leftX + nameWidth, yPos, "20px Minecraft-Regular", "red", "left", "top")

            // Draw player health
            for (let i = 0; i < 10; i++) {
                let xPos = healthOffset+(i)*this.iconSize;

                // Draw hearts based on player hp
                if (p.hp - i >= 1) {
                    ctx.drawImage(full_heart, xPos, yPos, this.iconSize, this.iconSize)
                } else if (p.hp - i > 0) {
                    ctx.drawImage(half_heart, xPos, yPos, this.iconSize, this.iconSize)
                    this.isHalf = false;
                } else {
                    ctx.drawImage(empty_heart, xPos, yPos, this.iconSize, this.iconSize)
                }
            }

            index++;
        }

        let p = player;
        if (!p.ping) return;

        // Draw client name
        let xPos = canvas.width/2-width/2+pad;
        let yPos = topY+30*(index+1);
        drawText(p.name, xPos, yPos, "20px Minecraft-Regular", getPlayerColor(player), "left", "top")
        let nameWidth = ctx.measureText(p.name).width;
        if (p.operator) drawText(" [admin]", xPos + nameWidth, yPos, "20px Minecraft-Regular", "red", "left", "top")

        // Draw player ping
        let ping = round(p.ping.reduce((a, b) => a + b, 0)/p.ping.length, 0) || "disc";
        drawText(ping, rightX, yPos, "20px Minecraft-Regular", "white", "right", "top")

        // Draw player health
        for (let i = 0; i < 10; i++) {
            let xPos = healthOffset+(i)*this.iconSize;

            // Draw hearts based on player hp
            if (p.hp - i >= 1) {
                ctx.drawImage(full_heart, xPos, yPos, this.iconSize, this.iconSize)
            } else if (p.hp - i > 0) {
                ctx.drawImage(half_heart, xPos, yPos, this.iconSize, this.iconSize)
                this.isHalf = false;
            } else {
                ctx.drawImage(empty_heart, xPos, yPos, this.iconSize, this.iconSize)
            }
        }
    }

    display() {
        this.displayCrosshair();
        this.displayPlayerTab();

        if (player.mode != "survival") return;
        this.displayHealth();
        this.displayHunger();
        this.displayOxygen();
    }

    // Display crosshair
    displayCrosshair() {
        if (!initialized || player.mode == "camera") return;
        let {crosshairSize, crosshairWidth} = this;
    
        // Draw crosshair
        ctx.fillRect(canvas.width/2-crosshairWidth/2, canvas.height/2-crosshairSize/2, crosshairWidth, crosshairSize)
        ctx.fillRect(canvas.width/2-crosshairSize/2, canvas.height/2-crosshairWidth/2, crosshairSize, crosshairWidth)
    }
}