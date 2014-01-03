define(function(require, exports, module) {
    main.consumes = [
        "Editor", "editors", "ui", "tabManager", "settings", "Form",
        "commands", "fs", "ace", "layout"
    ];
    main.provides = ["welcome"];
    return main;

     /*
        Change Ace Theme
            - Get List from Ace
    */

    function main(options, imports, register) {
        var Editor     = imports.Editor;
        var editors    = imports.editors;
        var ui         = imports.ui;
        var fs         = imports.fs;
        var ace        = imports.ace;
        var commands   = imports.commands;
        var layout     = imports.layout;
        var tabManager = imports.tabManager;
        var settings   = imports.settings;
        var Form       = imports.Form;
        
        /***** Initialization *****/
        
        var handle = editors.register("welcome", "URL Viewer", Welcome, []);
        
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
                        
                        // fs.exists("/README.md", function(exists){
                        //     if (exists)
                        //         commands.exec("preview", null, { 
                        //             path   : "/README.md", 
                        //             active : false 
                        //         });
                        // });
                    }
                }, handle);
            }, handle);
        }
        
        var drawn = false;
        function draw() {
            if (drawn) return;
            drawn = true;
            
            // Insert CSS
            ui.insertCss(require("text!./style.css"), 
                options.staticPrefix, handle);
        }
        
        handle.on("load", load);

        var counter  = 0;
        
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
            var tab = search();
            if (tab)
                return tabManager.focusTab(tab);
            
            tabManager.open({ 
                editorType : "welcome", 
                noanim     : true,
                active     : true 
            }, cb);
        }
        
        function Welcome(){
            var plugin = new Editor("Ajax.org", main.consumes, []);
            //var emit   = plugin.getEmitter();
            
            var container;
            
            plugin.on("draw", function(e){
                draw();
                
                // Create UI elements
                container = e.htmlNode;
                
                ui.insertHtml(container, require("text!./welcome.html"), plugin);
                
                var list = [];
                var themes = ace.themes
                for (var base in themes) {
                    if (themes[base] instanceof Array)
                        themes[base].forEach(function (n) {
                            var themeprop = Object.keys(n)[0];
                            list.push({ caption: themeprop, value: n[themeprop] });
                        });
                    else
                        list.push({ caption: base, value: themes[base] });
                }
                
                var form = new Form({
                    edge      : "3 3 8 3",
                    model     : settings.model,
                    rowheight : 35,
                    colwidth  : 150,
                    style     : "padding:10px;",
                    form      : [
                        {
                            title : "Main Theme",
                            type  : "dropdown",
                            path  : "user/general/@skin",
                            width : 165,
                            items : [
                                { caption: "Cloud9 Dark Theme", value: "dark" },
                                { caption: "Cloud9 Bright Theme", value: "light" }
                            ],
                            position : 100
                        },
                        {
                            title : "Base Layout",
                            type  : "dropdown",
                            // path  : "user/general/@layout",
                            width : 165,
                            defaultValue : "default",
                            onchange : function(e){
                                if (e.value == "minimal" && !settings.getBool("state/welcome/@switched")) {
                                    setTimeout(function(){
                                        var div = container.querySelector(".switched");
                                        div.style.display = "block";
                                        if (!apf.isMac)
                                            div.innerHTML = div.innerHTML.replace(/Command/g, "Ctrl");
                                        settings.set("state/welcome/@switched", true);
                                    }, 500)
                                }
                                
                                setTimeout(function(){
                                    layout.setBaseLayout(e.value);
                                });
                            },
                            items : [
                                { caption: "Professional IDE", value: "default" },
                                { caption: "Programmer's Editor", value: "minimal" }
                            ],
                            position : 150
                        },
                        {
                            title : "Split Layout",
                            type  : "dropdown",
                            width : 165,
                            defaultValue : "nosplit",
                            onchange : function(e){
                                commands.exec(e.value);
                            },
                            items : [
                                { caption: "No Split", value: "nosplit" },
                                { caption: "Two Vertical Split", value: "twovsplit" },
                                { caption: "Two Horizontal Split", value: "twohsplit" },
                                { caption: "Four Split", value: "foursplit" },
                                { caption: "Three Split (Left)", value: "threeleft" },
                                { caption: "Three Split (Right)", value: "threeright" }
                            ],
                            position : 150
                        },
                        {
                            title    : "Editor (Ace) Theme",
                            type     : "dropdown",
                            path     : "user/ace/@theme",
                            width    : 165,
                            onchange : function(e){
                                ace.setTheme(e.value);
                            },
                            items    : list,
                            position : 180
                        },
                        {
                            title : "Keyboard Mode",
                            type  : "dropdown",
                            path  : "user/ace/@keyboardmode",
                            width : 165,
                            items : [
                                { caption: "Default", value: "default" },
                                { caption: "Vim", value: "vim" },
                                { caption: "Emacs", value: "emacs" }
                            ],
                            position : 190
                        },
                        {
                            title        : "Soft Tabs",
                            type         : "checked-spinner",
                            checkboxPath : "project/ace/@useSoftTabs",
                            path         : "project/ace/@tabSize",
                            min          : "1",
                            max          : "64",
                            width        : "50",
                            position     : 200
                        },
                        {
                            title    : "Enable Auto-Save",
                            type     : "checkbox",
                            position : 300,
                            path     : "user/general/@autosave"
                        }
                    ]
                });
                
                form.attachTo(container.querySelector(".configure .form"));
                
                container.querySelector(".configure .more").onclick = function(){
                    commands.exec("openpreferences");
                };
                container.querySelector(".openterminal").onclick = function(){
                    tabManager.openEditor("terminal", true, function(){});
                };
                container.querySelector(".openconsole").onclick = function(){
                    commands.exec("toggleconsole");
                };
                container.querySelector(".newfile").onclick = function(){
                    commands.exec("newfile");
                };
            });
            
            /***** Method *****/
            
            /***** Lifecycle *****/
            
            plugin.on("load", function(){
                
            });
            plugin.on("documentLoad", function(e){
                var doc = e.doc;
                var tab = doc.tab;
                
                function setTheme(e){
                    var isDark = e.theme == "dark";
                    tab.backgroundColor = isDark ? "#203947" : "#b7c9d4";
                    if (isDark) tab.className.add("dark");
                    else tab.className.remove("dark");
                }
                
                layout.on("themeChange", setTheme);
                setTheme({ theme: settings.get("user/general/@skin") || "dark" });
                
                doc.title = "Welcome", 
                doc.meta.welcome = true;
            });
            
            /***** Register and define API *****/
            
            plugin.freezePublicAPI({
                
            });
            
            plugin.load("welcome" + counter++);
            
            return plugin;
        }
        
        register(null, {
            welcome: handle
        });
    }
});