define(function(require, exports, module) {
    main.consumes = [
        "Editor", "editors", "ui", "tabManager", "settings", "Form",
        "commands", "fs"
    ];
    main.provides = ["welcome"];
    return main;

     /*
        Change Main Theme
            - Instant Change
        Change Ace Theme
            - Get List from Ace
        Switch Layouts
            - Add to layout.js
    */

    function main(options, imports, register) {
        var Editor     = imports.Editor;
        var editors    = imports.editors;
        var ui         = imports.ui;
        var fs         = imports.fs;
        var commands   = imports.commands;
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
                        
                        fs.exists("/README.md", function(exists){
                            if (exists)
                                commands.exec("preview", null, { 
                                    path   : "/README.md", 
                                    active : false 
                                });
                        });
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
                
                var form = new Form({
                    edge      : "3 3 8 3",
                    model     : settings.model,
                    rowheight : 35,
                    colwidth  : 150,
                    style     : "padding:10px;",
                    form      : [
                        {
                            title : "Choose Main Theme",
                            type  : "dropdown",
                            path  : "user/general/@skin",
                            width : 150,
                            items : [
                                { caption: "Cloud9 Dark Theme", value: "dark" },
                                { caption: "Cloud9 Bright Theme", value: "white" }
                            ],
                            position : 100
                        },
                        // "Choose Ace Theme" : {
                        //     type  : "dropdown",
                        //     path  : "user/ace/@theme",
                        //     width : 150,
                        //     items : [
                        //         { caption: "Cloud9 Dark Theme", value: "dark" },
                        //         { caption: "Cloud9 Bright Theme", value: "white" }
                        //     ],
                        //     position : 900
                        // },
                        // Switch Layouts
                        // Key Bindings
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
                tab.backgroundColor = "#203947";
                tab.className.add("dark");
                
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