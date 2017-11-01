
class Sound
{
    constructor()
    {
        createjs.Sound.registerSound("sounds/210794__diboz__clockwatcher.wav", "ambient");
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
        this.playing[name] = createjs.Sound.play(name, {loop:-1, volume: 0.8});
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

