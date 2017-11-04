
class Sound
{
    constructor()
    {
        // from https://github.com/CreateJS/SoundJS/blob/master/examples/00_Basics.html
        if (!createjs.Sound.initializeDefaultPlugins()) 
        {
			document.getElementById("error").style.display = "block";
			document.getElementById("content").style.display = "none";
			return;
		}
		// check if we are on a mobile device, as these currently require us to launch sound inside of a user event
		if (createjs.BrowserDetect.isIOS || createjs.BrowserDetect.isAndroid || createjs.BrowserDetect.isBlackberry) 
        {
			document.getElementById("mobile").style.display = "block";
			document.getElementById("content").style.display = "none";
			return;
		}
        
        var that = this;
        createjs.Sound.addEventListener("fileload", function(event) {
            //console.log(event);
            if (event.id === "ambient")
            {
                that.playLoop("ambient");
            }
        });
        createjs.Sound.registerSound("sounds/92734__tj-mothy__slow-sad-tones.wav", "ambient");
        createjs.Sound.registerSound("sounds/165331__ani-music__tubular-bell-of-death.wav", "gong");
        createjs.Sound.registerSound("sounds/15073__jovica__tubular-system-g-3.wav", "pitch");

        this.playing = 
        {
            "gong" : null, 
            "pitch" : null, 
            "ambient" : null
        };
    }

    playLoop(name)
    {
        this.playing[name] = createjs.Sound.play(name, {loop:-1, volume: 0.6});
    }

    playOnce(name)
    {
        if (this.playing[name] === null) 
        {
            var that = this;
            this.playing[name] = createjs.Sound.play(name).on('complete', function() {
                that.playing[name] = null;
            });
        }
    }

}

