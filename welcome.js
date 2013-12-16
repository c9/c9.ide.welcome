define(function(require, exports, module) {
    main.consumes = ["Plugin", "ui", "tabManager", "settings", "c9"];
    main.provides = ["home"];
    return main;

    function main(options, imports, register) {
        var Plugin     = imports.Plugin;
        var ui         = imports.ui;
        var c9         = imports.c9;
        var tabManager = imports.tabManager;
        var settings   = imports.settings;
        
        /***** Initialization *****/
        
        var plugin = new Plugin("Ajax.org", main.consumes);
        var emit   = plugin.getEmitter();
        
        /*
            Logo
            User Name
            Workspace Name
            Change Main Theme
            Change Ace Theme
            Open Recent Files
            Point to preferences
            List of recent blog articles
            Walkthroughs (movies)
            
            Also open readme
        */
        
        var loaded = false;
        function load() {
            if (loaded) return false;
            loaded = true;
            
            tabManager.on("ready", function(){
                settings.on("read", function(){
                    if (!settings.getBool("state/welcome/@first")) {
                        show(function(){
                            settings.set("state/welcome/@first", true);
                        });
                    }
                    else {
                        var tab = search();
                        if (tab) listen(tab);
                    }
                });
            });
        }
        
        var drawn = false;
        function draw() {
            if (drawn) return;
            drawn = true;
            
            // Insert CSS
            ui.insertCss(require("text!./style.css"), plugin);
        
            emit("draw");
        }
        
        /***** Methods *****/
        
        function search(){
            var found;
            var tabs = tabManager.getTabs();
            tabs.every(function(tab){
                if (tab.document.meta.welcome) {
                    found = tab;
                    return false;
                }
                return true;
            });
            return found;
        }
        
        function show(cb) {
            draw();
            
            var tab = search();
            if (tab)
                return tabManager.focusTab(tab);
            
            tabManager.open({ 
                editorType : "urlview", 
                value      : options.staticPrefix 
                    + "/welcome.html?host=" + location.origin, 
                noanim     : true,
                document   : { 
                    title : "Welcome", 
                    meta  : { 
                        welcome: true 
                    } 
                }, 
                active     : true 
            }, function(err, tab){ 
                listen(tab);
                cb && cb(err, tab);
            });
        }
        
        function listen(tab){
            var session = tab.document.getSession();
            
            var staticHost = (c9.staticUrl.match(/(http:\/\/.*?)\//) || false)[1] 
                || location.origin;
                
            window.addEventListener("message", function(e) {
                if (c9.hosted && event.origin !== staticHost)
                    return;
                
                // if (e.data.message == "stream.document") {
                //     session.source = e.source;
                //     session.source.postMessage({
                //         type    : "document",
                //         content : session.previewTab.document.value
                //     }, location.origin);
                    
                //     tab.className.remove("loading");
                // }
            }, false);
        }
        
        /***** Lifecycle *****/
        
        plugin.on("load", function() {
            load();
        });
        plugin.on("enable", function() {
            
        });
        plugin.on("disable", function() {
            
        });
        plugin.on("unload", function() {
            loaded = false;
            drawn  = false;
        });
        
        /***** Register and define API *****/
        
        /**
         * 
         **/
        plugin.freezePublicAPI({
            /**
             * 
             */
            show : show,
            
            _events : [
                /**
                 * @event draw
                 */
                "draw"
            ]
        });
        
        register(null, {
            home: plugin
        });
    }
});