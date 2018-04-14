/* CookiesTable.js */
/*
 * Copyright (C) 2009 Apple Inc.  All rights reserved.
 * Copyright (C) 2009 Joseph Pecoraro
 * Copyright (C) 2010 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @constructor
 * @extends {WebInspector.VBox}
 * @param {boolean} expandable
 * @param {function()=} refreshCallback
 * @param {function()=} selectedCallback
 */
WebInspector.CookiesTable = function(expandable, refreshCallback, selectedCallback)
{
    WebInspector.VBox.call(this);

    var readOnly = expandable;
    this._refreshCallback = refreshCallback;

    var columns = [
        {id: "name", title: WebInspector.UIString("Name"), sortable: true, disclosure: expandable, sort: WebInspector.DataGrid.Order.Ascending, longText: true, weight: 24},
        {id: "value", title: WebInspector.UIString("Value"), sortable: true, longText: true, weight: 34},
        {id: "domain", title: WebInspector.UIString("Domain"), sortable: true, weight: 7},
        {id: "path", title: WebInspector.UIString("Path"), sortable: true, weight: 7},
        {id: "expires", title: WebInspector.UIString("Expires / Max-Age"), sortable: true, weight: 7},
        {id: "size", title: WebInspector.UIString("Size"), sortable: true, align: WebInspector.DataGrid.Align.Right, weight: 7},
        {id: "httpOnly", title: WebInspector.UIString("HTTP"), sortable: true, align: WebInspector.DataGrid.Align.Center, weight: 7},
        {id: "secure", title: WebInspector.UIString("Secure"), sortable: true, align: WebInspector.DataGrid.Align.Center, weight: 7},
        {id: "sameSite", title: WebInspector.UIString("Same-Site"), sortable: true, align: WebInspector.DataGrid.Align.Center, weight: 7}
    ];

    if (readOnly)
        this._dataGrid = new WebInspector.DataGrid(columns);
    else
        this._dataGrid = new WebInspector.DataGrid(columns, undefined, this._onDeleteCookie.bind(this), refreshCallback, this._onContextMenu.bind(this));

    this._dataGrid.setName("cookiesTable");
    this._dataGrid.addEventListener(WebInspector.DataGrid.Events.SortingChanged, this._rebuildTable, this);

    if (selectedCallback)
        this._dataGrid.addEventListener(WebInspector.DataGrid.Events.SelectedNode, selectedCallback, this);

    this._nextSelectedCookie = /** @type {?WebInspector.Cookie} */ (null);

    this._dataGrid.asWidget().show(this.element);
    this._data = [];
}

WebInspector.CookiesTable.prototype = {
    /**
     * @param {?string} domain
     */
    _clearAndRefresh: function(domain)
    {
        this.clear(domain);
        this._refresh();
    },

    /**
     * @param {!WebInspector.ContextMenu} contextMenu
     * @param {!WebInspector.DataGridNode} node
     */
    _onContextMenu: function(contextMenu, node)
    {
        if (node === this._dataGrid.creationNode)
            return;
        var cookie = node.cookie;
        var domain = cookie.domain();
        if (domain)
            contextMenu.appendItem(WebInspector.UIString.capitalize("Clear ^all from \"%s\"", domain), this._clearAndRefresh.bind(this, domain));
        contextMenu.appendItem(WebInspector.UIString.capitalize("Clear ^all"), this._clearAndRefresh.bind(this, null));
    },

    /**
     * @param {!Array.<!WebInspector.Cookie>} cookies
     */
    setCookies: function(cookies)
    {
        this.setCookieFolders([{cookies: cookies}]);
    },

    /**
     * @param {!Array.<!{folderName: ?string, cookies: !Array.<!WebInspector.Cookie>}>} cookieFolders
     */
    setCookieFolders: function(cookieFolders)
    {
        this._data = cookieFolders;
        this._rebuildTable();
    },

    /**
     * @return {?WebInspector.Cookie}
     */
    selectedCookie: function()
    {
        var node = this._dataGrid.selectedNode;
        return node ? node.cookie : null;
    },

    /**
     * @param {?string=} domain
     */
    clear: function(domain)
    {
        for (var i = 0, length = this._data.length; i < length; ++i) {
            var cookies = this._data[i].cookies;
            for (var j = 0, cookieCount = cookies.length; j < cookieCount; ++j) {
                if (!domain || cookies[j].domain() === domain)
                    cookies[j].remove();
            }
        }
    },

    _rebuildTable: function()
    {
        var selectedCookie = this._nextSelectedCookie || this.selectedCookie();
        this._nextSelectedCookie = null;
        this._dataGrid.rootNode().removeChildren();
        for (var i = 0; i < this._data.length; ++i) {
            var item = this._data[i];
            if (item.folderName) {
                var groupData = {name: item.folderName, value: "", domain: "", path: "", expires: "", size: this._totalSize(item.cookies), httpOnly: "", secure: "", sameSite: ""};
                var groupNode = new WebInspector.DataGridNode(groupData);
                groupNode.selectable = true;
                this._dataGrid.rootNode().appendChild(groupNode);
                groupNode.element().classList.add("row-group");
                this._populateNode(groupNode, item.cookies, selectedCookie);
                groupNode.expand();
            } else
                this._populateNode(this._dataGrid.rootNode(), item.cookies, selectedCookie);
        }
    },

    /**
     * @param {!WebInspector.DataGridNode} parentNode
     * @param {?Array.<!WebInspector.Cookie>} cookies
     * @param {?WebInspector.Cookie} selectedCookie
     */
    _populateNode: function(parentNode, cookies, selectedCookie)
    {
        parentNode.removeChildren();
        if (!cookies)
            return;

        this._sortCookies(cookies);
        for (var i = 0; i < cookies.length; ++i) {
            var cookie = cookies[i];
            var cookieNode = this._createGridNode(cookie);
            parentNode.appendChild(cookieNode);
            if (selectedCookie && selectedCookie.name() === cookie.name() && selectedCookie.domain() === cookie.domain() && selectedCookie.path() === cookie.path())
                cookieNode.select();
        }
    },

    _totalSize: function(cookies)
    {
        var totalSize = 0;
        for (var i = 0; cookies && i < cookies.length; ++i)
            totalSize += cookies[i].size();
        return totalSize;
    },

    /**
     * @param {!Array.<!WebInspector.Cookie>} cookies
     */
    _sortCookies: function(cookies)
    {
        var sortDirection = this._dataGrid.isSortOrderAscending() ? 1 : -1;

        function compareTo(getter, cookie1, cookie2)
        {
            return sortDirection * (getter.apply(cookie1) + "").compareTo(getter.apply(cookie2) + "");
        }

        function numberCompare(getter, cookie1, cookie2)
        {
            return sortDirection * (getter.apply(cookie1) - getter.apply(cookie2));
        }

        function expiresCompare(cookie1, cookie2)
        {
            if (cookie1.session() !== cookie2.session())
                return sortDirection * (cookie1.session() ? 1 : -1);

            if (cookie1.session())
                return 0;

            if (cookie1.maxAge() && cookie2.maxAge())
                return sortDirection * (cookie1.maxAge() - cookie2.maxAge());
            if (cookie1.expires() && cookie2.expires())
                return sortDirection * (cookie1.expires() - cookie2.expires());
            return sortDirection * (cookie1.expires() ? 1 : -1);
        }

        var comparator;
        switch (this._dataGrid.sortColumnIdentifier()) {
            case "name": comparator = compareTo.bind(null, WebInspector.Cookie.prototype.name); break;
            case "value": comparator = compareTo.bind(null, WebInspector.Cookie.prototype.value); break;
            case "domain": comparator = compareTo.bind(null, WebInspector.Cookie.prototype.domain); break;
            case "path": comparator = compareTo.bind(null, WebInspector.Cookie.prototype.path); break;
            case "expires": comparator = expiresCompare; break;
            case "size": comparator = numberCompare.bind(null, WebInspector.Cookie.prototype.size); break;
            case "httpOnly": comparator = compareTo.bind(null, WebInspector.Cookie.prototype.httpOnly); break;
            case "secure": comparator = compareTo.bind(null, WebInspector.Cookie.prototype.secure); break;
            case "sameSite": comparator = compareTo.bind(null, WebInspector.Cookie.prototype.sameSite); break;
            default: compareTo.bind(null, WebInspector.Cookie.prototype.name);
        }

        cookies.sort(comparator);
    },

    /**
     * @param {!WebInspector.Cookie} cookie
     * @return {!WebInspector.DataGridNode}
     */
    _createGridNode: function(cookie)
    {
        var data = {};
        data.name = cookie.name();
        data.value = cookie.value();
        if (cookie.type() === WebInspector.Cookie.Type.Request) {
            data.domain = WebInspector.UIString("N/A");
            data.path = WebInspector.UIString("N/A");
            data.expires = WebInspector.UIString("N/A");
        } else {
            data.domain = cookie.domain() || "";
            data.path = cookie.path() || "";
            if (cookie.maxAge())
                data.expires = Number.secondsToString(parseInt(cookie.maxAge(), 10));
            else if (cookie.expires())
                data.expires = new Date(cookie.expires()).toISOString();
            else
                data.expires = WebInspector.UIString("Session");
        }
        data.size = cookie.size();
        const checkmark = "\u2713";
        data.httpOnly = (cookie.httpOnly() ? checkmark : "");
        data.secure = (cookie.secure() ? checkmark : "");
        data.sameSite = (cookie.sameSite() ? checkmark : "");

        var node = new WebInspector.DataGridNode(data);
        node.cookie = cookie;
        node.selectable = true;
        return node;
    },

    _onDeleteCookie: function(node)
    {
        var cookie = node.cookie;
        var neighbour = node.traverseNextNode() || node.traversePreviousNode();
        if (neighbour)
            this._nextSelectedCookie = neighbour.cookie;
        cookie.remove();
        this._refresh();
    },

    _refresh: function()
    {
        if (this._refreshCallback)
            this._refreshCallback();
    },

    __proto__: WebInspector.VBox.prototype
}
;/* FilmStripModel.js */
/*
 * Copyright 2015 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @constructor
 * @param {!WebInspector.TracingModel} tracingModel
 * @param {number=} zeroTime
 */
WebInspector.FilmStripModel = function(tracingModel, zeroTime)
{
    this._tracingModel = tracingModel;
    this._zeroTime = zeroTime || tracingModel.minimumRecordTime();

    /** @type {!Array<!WebInspector.FilmStripModel.Frame>} */
    this._frames = [];

    var browserProcess = tracingModel.processByName("Browser");
    if (!browserProcess)
        return;
    var mainThread = browserProcess.threadByName("CrBrowserMain");
    if (!mainThread)
        return;

    var events = mainThread.events();
    for (var i = 0; i < events.length; ++i) {
        var event = events[i];
        if (event.startTime < this._zeroTime)
            continue;
        if (!event.hasCategory(WebInspector.FilmStripModel._category))
            continue;
        if (event.name === WebInspector.FilmStripModel.TraceEvents.CaptureFrame) {
            var data = event.args["data"];
            if (data)
                this._frames.push(WebInspector.FilmStripModel.Frame._fromEvent(this, event, this._frames.length));
        } else if (event.name === WebInspector.FilmStripModel.TraceEvents.Screenshot) {
            this._frames.push(WebInspector.FilmStripModel.Frame._fromSnapshot(this, /** @type {!WebInspector.TracingModel.ObjectSnapshot} */ (event), this._frames.length));
        }
    }
}

WebInspector.FilmStripModel._category = "disabled-by-default-devtools.screenshot";

WebInspector.FilmStripModel.TraceEvents = {
    CaptureFrame: "CaptureFrame",
    Screenshot: "Screenshot"
}

WebInspector.FilmStripModel.prototype = {
    /**
     * @return {!Array<!WebInspector.FilmStripModel.Frame>}
     */
    frames: function()
    {
        return this._frames;
    },

    /**
     * @return {number}
     */
    zeroTime: function()
    {
        return this._zeroTime;
    },

    /**
     * @param {number} timestamp
     * @return {?WebInspector.FilmStripModel.Frame}
     */
    frameByTimestamp: function(timestamp)
    {
        /**
         * @param {number} timestamp
         * @param {!WebInspector.FilmStripModel.Frame} frame
         * @return {number}
         */
        function comparator(timestamp, frame)
        {
            return timestamp - frame.timestamp;
        }
        var index = this._frames.lowerBound(timestamp, comparator);
        return index < this._frames.length ? this._frames[index] : null;
    }
}

/**
 * @constructor
 * @param {!WebInspector.FilmStripModel} model
 * @param {number} timestamp
 * @param {number} index
 */
WebInspector.FilmStripModel.Frame = function(model, timestamp, index)
{
    this._model = model;
    this.timestamp = timestamp;
    this.index = index;
    /** @type {?string} */
    this._imageData = null;
    /** @type {?WebInspector.TracingModel.ObjectSnapshot} */
    this._snapshot = null;
}

/**
 * @param {!WebInspector.FilmStripModel} model
 * @param {!WebInspector.TracingModel.Event} event
 * @param {number} index
 * @return {!WebInspector.FilmStripModel.Frame}
 */
WebInspector.FilmStripModel.Frame._fromEvent = function(model, event, index)
{
    var frame = new WebInspector.FilmStripModel.Frame(model, event.startTime, index);
    frame._imageData = event.args["data"];
    return frame;
}

/**
 * @param {!WebInspector.FilmStripModel} model
 * @param {!WebInspector.TracingModel.ObjectSnapshot} snapshot
 * @param {number} index
 * @return {!WebInspector.FilmStripModel.Frame}
 */
WebInspector.FilmStripModel.Frame._fromSnapshot = function(model, snapshot, index)
{
    var frame = new WebInspector.FilmStripModel.Frame(model, snapshot.startTime, index);
    frame._snapshot = snapshot;
    return frame;
}

WebInspector.FilmStripModel.Frame.prototype = {
    /**
     * @return {!WebInspector.FilmStripModel}
     */
    model: function()
    {
        return this._model;
    },

    /**
     * @return {!Promise<?string>}
     */
    imageDataPromise: function()
    {
        if (this._imageData || !this._snapshot)
            return Promise.resolve(this._imageData);

        return /** @type {!Promise<?string>} */ (this._snapshot.objectPromise());
    }
}
;/* FilmStripView.js */
// Copyright 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @constructor
 * @extends {WebInspector.HBox}
 */
WebInspector.FilmStripView = function()
{
    WebInspector.HBox.call(this, true);
    this.registerRequiredCSS("components_lazy/filmStripView.css");
    this.contentElement.classList.add("film-strip-view");
    this._statusLabel = this.contentElement.createChild("div", "label");
    this.reset();
    this.setMode(WebInspector.FilmStripView.Modes.TimeBased);
}

WebInspector.FilmStripView.Events = {
    FrameSelected: "FrameSelected",
    FrameEnter: "FrameEnter",
    FrameExit: "FrameExit",
}

WebInspector.FilmStripView.Modes = {
    TimeBased: "TimeBased",
    FrameBased: "FrameBased"
}

WebInspector.FilmStripView.prototype = {
    /**
     * @param {string} mode
     */
    setMode: function(mode)
    {
        this._mode = mode;
        this.contentElement.classList.toggle("time-based", mode === WebInspector.FilmStripView.Modes.TimeBased);
        this.update();
    },

    /**
     * @param {!WebInspector.FilmStripModel} filmStripModel
     * @param {number} zeroTime
     * @param {number} spanTime
     */
    setModel: function(filmStripModel, zeroTime, spanTime)
    {
        this._model = filmStripModel;
        this._zeroTime = zeroTime;
        this._spanTime = spanTime;
        var frames = filmStripModel.frames();
        if (!frames.length) {
            this.reset();
            return;
        }
        this.update();
    },

    /**
     * @param {!WebInspector.FilmStripModel.Frame} frame
     * @return {!Promise<!Element>}
     */
    createFrameElement: function(frame)
    {
        var time = frame.timestamp;
        var element = createElementWithClass("div", "frame");
        element.title = WebInspector.UIString("Doubleclick to zoom image. Click to view preceding requests.");
        element.createChild("div", "time").textContent = Number.millisToString(time - this._zeroTime);
        var imageElement = element.createChild("div", "thumbnail").createChild("img");
        element.addEventListener("mousedown", this._onMouseEvent.bind(this, WebInspector.FilmStripView.Events.FrameSelected, time), false);
        element.addEventListener("mouseenter", this._onMouseEvent.bind(this, WebInspector.FilmStripView.Events.FrameEnter, time), false);
        element.addEventListener("mouseout", this._onMouseEvent.bind(this, WebInspector.FilmStripView.Events.FrameExit, time), false);
        element.addEventListener("dblclick", this._onDoubleClick.bind(this, frame), false);

        return frame.imageDataPromise().then(WebInspector.FilmStripView._setImageData.bind(null, imageElement)).then(returnElement);
        /**
         * @return {!Element}
         */
        function returnElement()
        {
            return element;
        }
    },

    /**
     * @param {number} time
     * @return {!WebInspector.FilmStripModel.Frame}
     */
    frameByTime: function(time)
    {
        /**
         * @param {number} time
         * @param {!WebInspector.FilmStripModel.Frame} frame
         * @return {number}
         */
        function comparator(time, frame)
        {
            return time - frame.timestamp;
        }
        // Using the first frame to fill the interval between recording start
        // and a moment the frame is taken.
        var frames = this._model.frames();
        var index = Math.max(frames.upperBound(time, comparator) - 1, 0);
        return frames[index];
    },

    update: function()
    {
        if (!this._model)
            return;
        var frames = this._model.frames();
        if (!frames.length)
            return;

        if (this._mode === WebInspector.FilmStripView.Modes.FrameBased) {
            Promise.all(frames.map(this.createFrameElement.bind(this))).then(appendElements.bind(this));
            return;
        }

        var width = this.contentElement.clientWidth;
        var scale = this._spanTime / width;
        this.createFrameElement(frames[0]).then(continueWhenFrameImageLoaded.bind(this));  // Calculate frame width basing on the first frame.

        /**
         * @this {WebInspector.FilmStripView}
         * @param {!Element} element0
         */
        function continueWhenFrameImageLoaded(element0)
        {
            var frameWidth = Math.ceil(WebInspector.measurePreferredSize(element0, this.contentElement).width);
            if (!frameWidth)
                return;

            var promises = [];
            for (var pos = frameWidth; pos < width; pos += frameWidth) {
                var time = pos * scale + this._zeroTime;
                promises.push(this.createFrameElement(this.frameByTime(time)).then(fixWidth));
            }
            Promise.all(promises).then(appendElements.bind(this));
            /**
             * @param {!Element} element
             * @return {!Element}
             */
            function fixWidth(element)
            {
                element.style.width = frameWidth + "px";
                return element;
            }
        }

        /**
         * @param {!Array.<!Element>} elements
         * @this {WebInspector.FilmStripView}
         */
        function appendElements(elements)
        {
            this.contentElement.removeChildren();
            for (var i = 0; i < elements.length; ++i)
                this.contentElement.appendChild(elements[i]);
        }
    },

    /**
     * @override
     */
    onResize: function()
    {
        if (this._mode === WebInspector.FilmStripView.Modes.FrameBased)
            return;
        this.update();
    },

    /**
     * @param {string} eventName
     * @param {number} timestamp
     */
    _onMouseEvent: function(eventName, timestamp)
    {
        this.dispatchEventToListeners(eventName, timestamp);
    },

    /**
     * @param {!WebInspector.FilmStripModel.Frame} filmStripFrame
     */
    _onDoubleClick: function(filmStripFrame)
    {
        new WebInspector.FilmStripView.Dialog(filmStripFrame, this._zeroTime);
    },

    reset: function()
    {
        this._zeroTime = 0;
        this.contentElement.removeChildren();
        this.contentElement.appendChild(this._statusLabel);
    },

    /**
     * @param {string} text
     */
    setStatusText: function(text)
    {
        this._statusLabel.textContent = text;
    },

    __proto__: WebInspector.HBox.prototype
}

/**
 * @param {!Element} imageElement
 * @param {?string} data
 */
WebInspector.FilmStripView._setImageData = function(imageElement, data)
{
    if (data)
        imageElement.src = "data:image/jpg;base64," + data;
}

/**
 * @constructor
 * @extends {WebInspector.VBox}
 * @param {!WebInspector.FilmStripModel.Frame} filmStripFrame
 * @param {number=} zeroTime
 */
WebInspector.FilmStripView.Dialog = function(filmStripFrame, zeroTime)
{
    WebInspector.VBox.call(this, true);
    this.registerRequiredCSS("components_lazy/filmStripDialog.css");
    this.contentElement.classList.add("filmstrip-dialog");
    this.contentElement.tabIndex = 0;

    this._frames = filmStripFrame.model().frames();
    this._index = filmStripFrame.index;
    this._zeroTime = zeroTime || filmStripFrame.model().zeroTime();

    this._imageElement = this.contentElement.createChild("img");
    var footerElement = this.contentElement.createChild("div", "filmstrip-dialog-footer");
    footerElement.createChild("div", "flex-auto");
    var prevButton = createTextButton("\u25C0", this._onPrevFrame.bind(this), undefined, WebInspector.UIString("Previous frame"));
    footerElement.appendChild(prevButton);
    this._timeLabel = footerElement.createChild("div", "filmstrip-dialog-label");
    var nextButton = createTextButton("\u25B6", this._onNextFrame.bind(this), undefined, WebInspector.UIString("Next frame"));
    footerElement.appendChild(nextButton);
    footerElement.createChild("div", "flex-auto");

    this.contentElement.addEventListener("keydown", this._keyDown.bind(this), false);
    this.setDefaultFocusedElement(this.contentElement);
    this._render();
}

WebInspector.FilmStripView.Dialog.prototype = {
    _resize: function()
    {
        if (!this._dialog) {
            this._dialog = new WebInspector.Dialog();
            this.show(this._dialog.element);
            this._dialog.setWrapsContent(true);
            this._dialog.show();
        }
        this._dialog.contentResized();
    },

    /**
     * @param {!Event} event
     */
    _keyDown: function(event)
    {
        switch (event.keyIdentifier) {
        case "Left":
            if (WebInspector.isMac() && event.metaKey)
                this._onFirstFrame();
            else
                this._onPrevFrame();
            break;

        case "Right":
            if (WebInspector.isMac() && event.metaKey)
                this._onLastFrame();
            else
                this._onNextFrame();
            break;

        case "Home":
            this._onFirstFrame();
            break;

        case "End":
            this._onLastFrame();
            break;
        }
    },

    _onPrevFrame: function()
    {
        if (this._index > 0)
            --this._index;
        this._render();
    },

    _onNextFrame: function()
    {
        if (this._index < this._frames.length - 1)
            ++this._index;
        this._render();
    },

    _onFirstFrame: function()
    {
        this._index = 0;
        this._render();
    },

    _onLastFrame: function()
    {
        this._index = this._frames.length - 1;
        this._render();
    },

    /**
     * @return {!Promise<undefined>}
     */
    _render: function()
    {
        var frame = this._frames[this._index];
        this._timeLabel.textContent = Number.millisToString(frame.timestamp - this._zeroTime);
        return frame.imageDataPromise().then(WebInspector.FilmStripView._setImageData.bind(null, this._imageElement)).then(this._resize.bind(this));
    },

    __proto__: WebInspector.VBox.prototype
}
;Runtime.cachedResources["components_lazy/filmStripDialog.css"] = "/*\n * Copyright (c) 2015 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n:host {\n    flex: none !important;\n}\n\n.filmstrip-dialog {\n    margin: 12px;\n}\n\n.filmstrip-dialog > img {\n    border: 1px solid #ddd;\n    max-height: 80vh;\n    max-width: 80vw;\n}\n\n.filmstrip-dialog-footer {\n    display: flex;\n    align-items: center;\n    margin-top: 10px;\n}\n\n.filmstrip-dialog-label {\n    margin: 8px 8px;\n}\n\n/*# sourceURL=components_lazy/filmStripDialog.css */";
Runtime.cachedResources["components_lazy/filmStripView.css"] = "/*\n * Copyright (c) 2015 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.film-strip-view {\n    overflow-x: auto;\n    overflow-y: hidden;\n    align-content: flex-start;\n    min-height: 81px;\n}\n\n.film-strip-view.time-based .frame .time {\n    display: none;\n}\n\n.film-strip-view .label {\n    margin: auto;\n    font-size: 18px;\n    color: #999;\n}\n\n.film-strip-view .frame {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    padding: 4px;\n    flex: none;\n    cursor: pointer;\n}\n\n.film-strip-view .frame-limit-reached {\n    font-size: 24px;\n    color: #888;\n    justify-content: center;\n    display: inline-flex;\n    flex-direction: column;\n    flex: none;\n}\n\n.film-strip-view .frame .thumbnail {\n    min-width: 24px;\n    display: flex;\n    flex-direction: row;\n    align-items: center;\n    pointer-events: none;\n    margin: 4px 0 2px;\n    border: 2px solid transparent;\n}\n\n.film-strip-view .frame:hover .thumbnail {\n    border-color: #FBCA46;\n}\n\n.film-strip-view .frame .thumbnail img {\n    height: auto;\n    width: auto;\n    max-width: 80px;\n    max-height: 50px;\n    pointer-events: none;\n    box-shadow: 0 0 3px #bbb;\n    flex: 0 0 auto;\n}\n\n.film-strip-view .frame:hover .thumbnail img {\n    box-shadow: none;\n}\n\n.film-strip-view .frame .time {\n    font-size: 10px;\n    margin-top: 2px;\n}\n\n/*# sourceURL=components_lazy/filmStripView.css */";
