/*!
 * Reblocks-jQuery - javascript helper functions for Reblocks 
 * v0.2.0
 *
 * https://github.com/html/reblocks-jquery
 */

// Taken from http://css-tricks.com/snippets/jquery/serialize-form-to-json/
jQuery.fn.serializeObject = function()
{
  var o = {};
  var a = this.serializeArray();
  jQuery.each(a, function() {
    if (o[this.name]) {
      if (!o[this.name].push) {
        o[this.name] = [o[this.name]];
      }
      o[this.name].push(this.value || '');
    } else {
      o[this.name] = this.value || '';
    }
  });
  return o;
};

/*
 * This prevents javascript error, but does not any effect like with usual reblocks flashes.
 */
window.Effect = Effect = {
  Pulsate: function(){ return {};},
  BlindUp: function(){ return {};}
};

/*
 * This prevents javascript error and replaces reblocks focusFirstElement form functionality
 */
jQuery.fn.focusFirstElement = function(){
  if(jQuery(this).length){
    jQuery(this).find('input:first').focus();
  }
};

jQuery.fn.serializeObjectWithSubmit = function(){
  var ret = this.serializeObject();
  var submitElement = jQuery(this).find('input[type=submit][clicked=true]');
  ret[submitElement.attr('name')] = submitElement.val();
  submitElement.attr('clicked', null);

  return ret;
};

// Utilities
function updateElementBody(element, newBody) {
  element.update(newBody);
}

function updateElement(element, newElement) {
  var $newElement = jQuery(newElement);
  element.replaceWith($newElement);
}

function applySubmitClickEvent() {
  jQuery("form input[type=submit]")
    .unbind('click.reblocks-submit-event')
    .bind('click.reblocks-submit-event', function() {
      $("input[type=submit]", $(this).parents("form")).removeAttr("clicked");
      $(this).attr("clicked", "true");
    });
}

function selectionEmpty() {
  if(document.getSelection) {
    return document.getSelection() == "";
  } else if(document.selection && document.selection.createRange) {
    return document.selection.createRange().text == "";
  } else {
    return true;
  }
}

function addCss(cssCode) {
  var styleElement = document.createElement("style");
  styleElement.type = "text/css";
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = cssCode;
  } else {
    styleElement.appendChild(document.createTextNode(cssCode));
  }
  document.getElementsByTagName("head")[0].appendChild(styleElement);
}

function stopPropagation(event) {
  if(event.preventDefault) {
    event.stopPropagation();
  } else {
    event.cancelBubble = true;
  };
}

function startProgress(){
    var progress = jQuery('#ajax-progress');
    progress.show(progress.data('show-speed'));
}

function stopProgress(){
    var progress = jQuery('#ajax-progress');
    progress.hide(progress.data('hide-speed'));
}

function log(message, arg) {
    window.console && console.log(message, arg);
}

// Register global AJAX handlers to show progress
jQuery(document).ajaxStart(function() {
    try {
        startProgress();
    } catch(e) {
        window.console && console.log(e, e.message);
  }
});

jQuery(document).ajaxStop(function() {
    stopProgress();
});

Object.values = function (obj) {
  var vals = [];
  for( var key in obj ) {
    if ( obj.hasOwnProperty(key) ) {
      vals.push(obj[key]);
    }
  }
  return vals;
}

function dumpTree(tree, deepness){
  if(!deepness){
    deepness = 1;
  }
  var prefix = '';
  for(var i=0;i<deepness;i++){
    prefix += ' ';
  }

  if(tree.children){
    for(var i=0;i<tree.children.length;i++){
      window.console && console.log(prefix + tree.children[i].id);
      dumpTree(tree.children[i], deepness + 1);
    }
  }
}

function widgetsJsonToTree(json){
  var widgetsTree = {
  };

  for(var i in json){
    widgetsTree[i] = {
      'id': i,
      'widget': jQuery(json[i]),
      'children': []
    };
  }

  var idsToDelete = [];

  for(var i in widgetsTree){
    var ids = jQuery('[id]', widgetsTree[i].widget).map(function(){
      return jQuery(this).attr('id');
    });

    var children = [];
    ids.map(function(key, id){
      if(widgetsTree[id]){
        children.push(widgetsTree[id]);
        idsToDelete.push(id);
      }
    });

    var exceptIds = [];

    for(var k in children){
      for(var l in children){
        if(k != l 
            && exceptIds.indexOf(children[l].id) == -1 
            && children[k].widget.find('#' + children[l].id).length){
              /*
          window.console && console.log(children[l].id, ' is child of ', children[k].id, 
            children[k].widget.find('#' + children[l].id)
          );*/
          exceptIds.push(children[l].id);
        }
      }
    }

    for(var k=0;k<children.length;k++){
      if(exceptIds.indexOf(children[k].id) == -1){
        widgetsTree[i].children.push(children[k]);
      }
    }
  }

  for(var i=0;i<idsToDelete.length;i++){
    delete widgetsTree[idsToDelete[i]];
  }

  //dumpTree({ children: Object.values(widgetsTree) });
  return widgetsTree.root ? widgetsTree.root : { children: Object.values(widgetsTree) };
}

function updateElementForTree(tree){
  if(tree.children){
    tree.children.map(updateElementForTree);
  }

  if(tree.id){
    jQuery('#' + tree.id).replaceWith(tree.widget);
  }
}

window.commandHandlers = {
    'updateWidget': function(params) {
        var widget = jQuery(params.widget);
        var target = jQuery('#' + params.domId);
        target.replaceWith(widget);
    },
    'insertWidget': function(params) {
        console.log('inserting widget' + params);
        
        var widget = jQuery(params.widget);
        if (params.after) {
            var target = jQuery('#' + params.after);
            widget.insertAfter(target);
        } else {
            if (params.before) {
                var target = jQuery('#' + params.before);
                widget.insertBefore(target);
            }
        }
    },
    'redirect': function(params) {
        window.location.href = params.to;
    },
    'executeCode': function(params) {
        jQuery(params.code).appendTo('body');
    },
    'includeCSS': function(params) {
        include_css(params.url);
    },
    'includeJS': function(params) {
        include_dom(params.url);
    },
};

function processCommand(command) {
    var method = command.method;
    // TODO: add a documentation on defining a command handler
    // and calling it from the server-side
    var handler = window.commandHandlers[method];
    console.log('processing command ' + method + 'with params: ');
    console.log(command);
    if (handler === undefined) {
        console.warn('No handler for ' + method + ' method');
    } else {
        var params = command.params;
        handler(params);
    }
}

function onActionSuccess(json){
  // TODO: add processing for redirect command
  //       and remove all this commented code after that.
  // See if there are redirects
  // var redirect = json['redirect'];
  // if (redirect)
  // {
  //   window.location.href = redirect;
  //   return;
  // }

  // execJsonCalls(json['before-load']);

  // // Update dirty widgets
  // var dirtyWidgets = json['widgets'];

  // updateElementForTree(widgetsJsonToTree(dirtyWidgets));

  var commands = json['commands'] || [];
  commands.forEach(processCommand);

  execJsonCalls(json['on-load']);
  applySubmitClickEvent();
}

function execJsonCalls (calls) {
  if(calls) {
    var executedCalls = [];
    jQuery.each(calls, function(i, item){
      if(executedCalls.indexOf(item) == -1){
        jQuery(item).appendTo('body');
        executedCalls.push(item);
      }
    });
  }
}

function onActionFailure(response) {
  log('Action failure', response);
  try{
    alert('Oops, we could not complete your request because of an internal error.');
  }catch(e){
    window.console && console.log(e, e.toString());
  }
}

function getActionUrl(actionCode, isPure) {
  actionCode = unescape(actionCode);
  var scriptName = location.protocol + "//"
    + location.hostname
    + (location.port ? ":" + location.port : "")
    + location.pathname;
  var query = location.search;
  var url = scriptName + query + (query ? "&" : "?")
    + "action=" + actionCode;

  if(isPure)
    url += '&pure=true';

  return url;
}

function initiateAction(actionCode, options) {
    startProgress();

    var options = options || {};
    var method = (options.method || 'POST').toUpperCase();
    var args = options.args || {};
    var url = options.url || getActionUrl(actionCode);
    var on_success = options.on_success;
    var on_failure = options.on_failure || onActionFailure;
    
    args.action = actionCode;

    // This logging is for debug only
    // log('Fireing action', actionCode);
    // log('with options', options);
    
    var ajax_options = {
        type: method,
        success: function(first, second, third) {
            // log('Action was successful', actionCode);
            onActionSuccess(first, second, third);
            on_success && on_success();
        },
        error: on_failure,
        data: args,
    }
    if (method == 'POST') {
        ajax_options.contentType = 'application/json';
        ajax_options.data = JSON.stringify(args)
    }
    jQuery.ajax(url, ajax_options);
}

function initiateFormAction(actionCode, form, options) {
    // Hidden "action" field should not be serialized on AJAX
    var options = options || {};
    var action_arguments = form.serializeObjectWithSubmit();
    delete(action_arguments['action']);

    options['args'] = action_arguments;
    options['method'] = options['method'] || form.attr('method');
    initiateAction(actionCode, options);
}

function disableIrrelevantButtons(currentButton) {
  $(currentButton).parents('form').find('submit').attr('disabled', true);
  $(currentButton).attr('disabled', false);
}

// Table hovering for IE (can't use CSS expressions because
// Event.observe isn't available there and we can't overwrite events
// using assignment
if(!window.XMLHttpRequest) {
  // IE6 only
  Event.observe(window, 'load', function() {
    var tableRows = $$('.table table tbody tr');
    tableRows.each(function(row) {
      Event.observe(row, 'mouseover', function() {
        row.addClassName('hover');
      });
      Event.observe(row, 'mouseout', function() {
        row.removeClassName('hover');
      });
    });
  });
}


function include_css(css_file) {
    appendStyleSheet(css_file);
}

function include_dom(script_filename) {
    if (!window.loadedDependencies.includes(script_filename)) {
        var html_doc = document.getElementsByTagName('head').item(0);
        var js = document.createElement('script');
        js.setAttribute('language', 'javascript');
        js.setAttribute('type', 'text/javascript');
        js.setAttribute('src', script_filename);
        html_doc.appendChild(js);
        window.loadedDependencies.push(script_filename);
    }
    return false;
}

/* working with CSS classes */
function addClass(el,myClass){
  if ((hasClass(el,myClass)) || (typeof el == 'undefined'))
    return;
  el.className += " " + myClass;
}

function removeClass(el,myClass){
  if (typeof el=='undefined')
    return;
  if (el.getAttribute('class') === null)
    return;

  var classes = el.getAttribute('class').split(" ");
  var result=[];

  for (i=classes.length;i>=0;i--) {
    if (classes[i] != myClass)
      result.push(classes[i]);
  }

  el.setAttribute('class', result.join(" ")); /* FIXME: ie6/7 need className here */
}

function hasClass(el, myClass){
  if ((el.className === null) || (typeof el == 'undefined'))
    return false;

  var classes = el.className.split(" ");

  for (i=classes.length;i>=0;i--) {
    if (classes[i] == myClass)
      return true;
  }

  return false;
}

/* collapsible sections */
function toggleExpandCollapse (heading,container) {
  if (hasClass(heading,"collapsed")) {
    removeClass(heading,"collapsed");
    removeClass(container,"collapsed");
    addClass(heading,"expanded");
    addClass(container,"expanded");
  } else {
    removeClass(heading,"expanded");
    removeClass(container,"expanded");
    addClass(heading,"collapsed");
    addClass(container,"collapsed");
  }
}

function updateWidgetStateFromHash() {
    libraryMissingWarning('updateWidgetStateFromHash');

    // Now this script is loaded as a dependency
    //  jQuery.getScript("/pub/scripts/jquery.ba-bbq.js", function(){
    
    $(window).bind('hashchange', function(event){
        var hash = window.location.hash;
        if (hash) {
            initiateActionWithArgs(null, null, {'reblocks-internal-location-hash':hash}, "GET", "/");
        }
    }).trigger('hashchange');
    
  // }).error(function(){
  //   if(!jQuery.bbq){
  //     window.console && console.log("It seems that jQuery BBQ library is missing, hashchange event will not be dispatched by Reblocks");
  //   }
  // });
}

function setLocationHash (hash) {
  window.location.hash = hash;
}

function libraryMissingWarning(feature){
  if(!window.withScripts){
    window.console && console.log("Please use javascript library https://github.com/html/jquery-seq to use " + feature + " functionality");
    return;
  }
}

$ = function(id){
  if(typeof(id) == 'string'){
    return jQuery('#' + id);
  }else{
    return jQuery(id);
  }
};

jQuery(function(){
  applySubmitClickEvent();
});


window.Event.observe = function(obj, evtType, func){
  if(obj == window && evtType == 'load'){
    jQuery(func);
  }else{
    window.console && console.log("Don't know what to do for " + obj + " and event type " + evtType);
  }
};

/*
 * Useful for waiting until element is appeared in html, usage is 
 * 
 * // Init code for input loaded with ajax
 * $('#some-input-should-be-loaded-with-ajax').onAvailable(function(){ 
 *     console.log("Hey, I'm loaded for 100%, now you don't have bugs with me");
 * });
 *
 */
jQuery.fn.onAvailable = function(fn){
  var sel = this.selector;
  var timer;
  var self = this;
  if (this.length > 0) {
    fn.call(this);   
  }
  else {
    timer = setInterval(function(){
      if (jQuery(sel).length > 0) {
        fn.call(jQuery(sel));
        clearInterval(timer);  
      }
    },50);  
  }
}
