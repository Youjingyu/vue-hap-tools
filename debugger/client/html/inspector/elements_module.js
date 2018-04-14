/* InspectElementModeController.js */
/*
 * Copyright (C) 2013 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 * 1. Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY GOOGLE INC. AND ITS CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL GOOGLE INC.
 * OR ITS CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @constructor
 * @implements {WebInspector.TargetManager.Observer}
 */
WebInspector.InspectElementModeController = function()
{
    this._toggleSearchAction = WebInspector.actionRegistry.action("elements.toggle-element-search");
    if (Runtime.experiments.isEnabled("layoutEditor")) {
        this._layoutEditorButton = new WebInspector.ToolbarToggle(WebInspector.UIString("Toggle Layout Editor"), "layout-editor-toolbar-item");
        this._layoutEditorButton.addEventListener("click", this._toggleLayoutEditor, this);
    }

    this._mode = DOMAgent.InspectMode.None;
    WebInspector.targetManager.addEventListener(WebInspector.TargetManager.Events.SuspendStateChanged, this._suspendStateChanged, this);
    WebInspector.targetManager.observeTargets(this, WebInspector.Target.Type.Page);
}

WebInspector.InspectElementModeController.prototype = {
    /**
     * @override
     * @param {!WebInspector.Target} target
     */
    targetAdded: function(target)
    {
        // When DevTools are opening in the inspect element mode, the first target comes in
        // much later than the InspectorFrontendAPI.enterInspectElementMode event.
        if (this._mode === DOMAgent.InspectMode.None)
            return;
        var domModel = WebInspector.DOMModel.fromTarget(target);
        domModel.setInspectMode(this._mode);
    },

    /**
     * @override
     * @param {!WebInspector.Target} target
     */
    targetRemoved: function(target)
    {
    },

    /**
     * @return {boolean}
     */
    isInInspectElementMode: function()
    {
        return this._mode === DOMAgent.InspectMode.SearchForNode || this._mode === DOMAgent.InspectMode.SearchForUAShadowDOM;
    },

    /**
     * @return {boolean}
     */
    isInLayoutEditorMode: function()
    {
        return this._mode === DOMAgent.InspectMode.ShowLayoutEditor;
    },

    stopInspection: function()
    {
        if (this._mode && this._mode !== DOMAgent.InspectMode.None)
            this._toggleInspectMode();
    },

    _toggleLayoutEditor: function()
    {
        var mode = this.isInLayoutEditorMode() ? DOMAgent.InspectMode.None : DOMAgent.InspectMode.ShowLayoutEditor;
        this._setMode(mode);
    },

    _toggleInspectMode: function()
    {
        if (WebInspector.targetManager.allTargetsSuspended())
            return;

        var mode;
        if (this.isInInspectElementMode())
            mode = DOMAgent.InspectMode.None;
        else
            mode = WebInspector.moduleSetting("showUAShadowDOM").get() ? DOMAgent.InspectMode.SearchForUAShadowDOM : DOMAgent.InspectMode.SearchForNode;

        this._setMode(mode);
    },

    /**
     * @param {!DOMAgent.InspectMode} mode
     */
    _setMode: function(mode)
    {
        this._mode = mode;
        for (var domModel of WebInspector.DOMModel.instances())
            domModel.setInspectMode(mode);

        if (this._layoutEditorButton) {
            this._layoutEditorButton.setEnabled(!this.isInInspectElementMode());
            this._layoutEditorButton.setToggled(this.isInLayoutEditorMode());
        }

        this._toggleSearchAction.setEnabled(!this.isInLayoutEditorMode());
        this._toggleSearchAction.setToggled(this.isInInspectElementMode());
    },

    _suspendStateChanged: function()
    {
        if (!WebInspector.targetManager.allTargetsSuspended())
            return;

        this._mode = DOMAgent.InspectMode.None;
        this._toggleSearchAction.setToggled(false);
        if (this._layoutEditorButton)
            this._layoutEditorButton.setToggled(false);
    }
}

/**
 * @constructor
 * @implements {WebInspector.ActionDelegate}
 */
WebInspector.InspectElementModeController.ToggleSearchActionDelegate = function()
{
}

WebInspector.InspectElementModeController.ToggleSearchActionDelegate.prototype = {
    /**
     * @override
     * @param {!WebInspector.Context} context
     * @param {string} actionId
     * @return {boolean}
     */
    handleAction: function(context, actionId)
    {
        if (!WebInspector.inspectElementModeController)
            return false;
        WebInspector.inspectElementModeController._toggleInspectMode();
        return true;
    }
}

/**
 * @constructor
 * @implements {WebInspector.ToolbarItem.Provider}
 */
WebInspector.InspectElementModeController.LayoutEditorButtonProvider = function()
{
}

WebInspector.InspectElementModeController.LayoutEditorButtonProvider.prototype = {
    /**
     * @override
     * @return {?WebInspector.ToolbarItem}
     */
    item: function()
    {
        if (!WebInspector.inspectElementModeController)
            return null;

        return WebInspector.inspectElementModeController._layoutEditorButton;
    }
}

/** @type {?WebInspector.InspectElementModeController} */
WebInspector.inspectElementModeController = Runtime.queryParam("isSharedWorker") ? null : new WebInspector.InspectElementModeController();
;/* BezierUI.js */
// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @constructor
 * @param {number} width
 * @param {number} height
 * @param {number} marginTop
 * @param {number} controlPointRadius
 * @param {boolean} linearLine
 */
WebInspector.BezierUI = function(width, height, marginTop, controlPointRadius, linearLine)
{
    this.width = width;
    this.height = height;
    this.marginTop = marginTop;
    this.radius = controlPointRadius;
    this.linearLine = linearLine;
}

WebInspector.BezierUI.prototype = {
    /**
     * @return {number}
     */
    curveWidth: function()
    {
        return this.width - this.radius * 2;
    },

    /**
     * @return {number}
     */
    curveHeight: function()
    {
        return this.height - this.radius * 2 - this.marginTop * 2;
    },

    /**
     * @param {!Element} parentElement
     * @param {string} className
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     */
    _drawLine: function(parentElement, className, x1, y1, x2, y2)
    {
        var line = parentElement.createSVGChild("line", className);
        line.setAttribute("x1", x1 + this.radius);
        line.setAttribute("y1", y1 + this.radius + this.marginTop);
        line.setAttribute("x2", x2 + this.radius);
        line.setAttribute("y2", y2 + this.radius + this.marginTop);
    },

    /**
     * @param {!Element} parentElement
     * @param {number} startX
     * @param {number} startY
     * @param {number} controlX
     * @param {number} controlY
     */
    _drawControlPoints: function(parentElement, startX, startY, controlX, controlY)
    {
        this._drawLine(parentElement, "bezier-control-line", startX, startY, controlX, controlY);
        var circle = parentElement.createSVGChild("circle", "bezier-control-circle");
        circle.setAttribute("cx", controlX + this.radius);
        circle.setAttribute("cy", controlY + this.radius + this.marginTop);
        circle.setAttribute("r", this.radius);
    },

    /**
     * @param {?WebInspector.Geometry.CubicBezier} bezier
     * @param {!Element} svg
     */
    drawCurve: function(bezier, svg)
    {
        if (!bezier)
            return;
        var width = this.curveWidth();
        var height = this.curveHeight();
        svg.setAttribute("width", this.width);
        svg.setAttribute("height", this.height);
        svg.removeChildren();
        var group = svg.createSVGChild("g");

        if (this.linearLine)
            this._drawLine(group, "linear-line", 0, height, width, 0);

        var curve = group.createSVGChild("path", "bezier-path");
        var curvePoints = [
            new WebInspector.Geometry.Point(bezier.controlPoints[0].x * width + this.radius, (1 - bezier.controlPoints[0].y) * height + this.radius + this.marginTop),
            new WebInspector.Geometry.Point(bezier.controlPoints[1].x * width + this.radius, (1 - bezier.controlPoints[1].y) * height + this.radius + this.marginTop),
            new WebInspector.Geometry.Point(width + this.radius, this.marginTop + this.radius)
        ];
        curve.setAttribute("d", "M" + this.radius + "," + (height + this.radius + this.marginTop) + " C" + curvePoints.join(" "));

        this._drawControlPoints(group, 0, height, bezier.controlPoints[0].x * width, (1 - bezier.controlPoints[0].y) * height);
        this._drawControlPoints(group, width, 0, bezier.controlPoints[1].x * width, (1 - bezier.controlPoints[1].y) * height);
    }
}

WebInspector.BezierUI.Height = 26;

/**
 * @param {!WebInspector.Geometry.CubicBezier} bezier
 * @param {!Element} path
 * @param {number} width
 */
WebInspector.BezierUI.drawVelocityChart = function(bezier, path, width)
{
    var height = WebInspector.BezierUI.Height;
    var pathBuilder = ["M", 0, height];
    /** @const */ var sampleSize = 1 / 40;

    var prev = bezier.evaluateAt(0);
    for (var t = sampleSize; t < 1 + sampleSize; t += sampleSize) {
        var current = bezier.evaluateAt(t);
        var slope = (current.y - prev.y) / (current.x - prev.x);
        var weightedX = prev.x * (1 - t) + current.x * t;
        slope = Math.tanh(slope / 1.5); // Normalise slope
        pathBuilder = pathBuilder.concat(["L", (weightedX * width).toFixed(2), (height - slope * height).toFixed(2) ]);
        prev = current;
    }
    pathBuilder = pathBuilder.concat(["L", width.toFixed(2), height, "Z"]);
    path.setAttribute("d", pathBuilder.join(" "));
}
;/* StylesPopoverHelper.js */
// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @constructor
 * @extends {WebInspector.Object}
 */
WebInspector.StylesPopoverHelper = function()
{
    this._popover = new WebInspector.Popover();
    this._popover.setCanShrink(false);
    this._popover.setNoMargins(true);
    this._popover.element.addEventListener("mousedown", consumeEvent, false);

    this._hideProxy = this.hide.bind(this, true);
    this._boundOnKeyDown = this._onKeyDown.bind(this);
    this._repositionBound = this.reposition.bind(this);
    this._boundFocusOut = this._onFocusOut.bind(this);
}

WebInspector.StylesPopoverHelper.prototype = {
    /**
     * @param {!Event} event
     */
    _onFocusOut: function(event)
    {
        if (!event.relatedTarget || event.relatedTarget.isSelfOrDescendant(this._view.contentElement))
            return;
        this._hideProxy();
    },

    /**
     * @return {boolean}
     */
    isShowing: function()
    {
        return this._popover.isShowing();
    },

    /**
     * @param {!WebInspector.Widget} view
     * @param {!Element} anchorElement
     * @param {function(boolean)=} hiddenCallback
     */
    show: function(view, anchorElement, hiddenCallback)
    {
        if (this._popover.isShowing()) {
            if (this._anchorElement === anchorElement)
                return;

            // Reopen the picker for another anchor element.
            this.hide(true);
        }

        delete this._isHidden;
        this._anchorElement = anchorElement;
        this._view = view;
        this._hiddenCallback = hiddenCallback;
        this.reposition();

        var document = this._popover.element.ownerDocument;
        document.addEventListener("mousedown", this._hideProxy, false);
        document.defaultView.addEventListener("resize", this._hideProxy, false);
        this._view.contentElement.addEventListener("keydown", this._boundOnKeyDown, false);

        this._scrollerElement = anchorElement.enclosingNodeOrSelfWithClass("style-panes-wrapper");
        if (this._scrollerElement)
            this._scrollerElement.addEventListener("scroll", this._repositionBound, false);
    },

    /**
     * @param {!Event=} event
     */
    reposition: function(event)
    {
        if (!this._previousFocusElement)
            this._previousFocusElement = WebInspector.currentFocusElement();
        // Unbind "blur" listener to avoid reenterability: |popover.showView| will hide the popover and trigger it synchronously.
        this._view.contentElement.removeEventListener("focusout", this._boundFocusOut, false);
        this._popover.showView(this._view, this._anchorElement);
        this._view.contentElement.addEventListener("focusout", this._boundFocusOut, false);
        WebInspector.setCurrentFocusElement(this._view.contentElement);
    },

    /**
     * @param {boolean=} commitEdit
     */
    hide: function(commitEdit)
    {
        if (this._isHidden)
            return;
        var document = this._popover.element.ownerDocument;
        this._isHidden = true;
        this._popover.hide();

        if (this._scrollerElement)
            this._scrollerElement.removeEventListener("scroll", this._repositionBound, false);

        document.removeEventListener("mousedown", this._hideProxy, false);
        document.defaultView.removeEventListener("resize", this._hideProxy, false);

        if (this._hiddenCallback)
            this._hiddenCallback.call(null, !!commitEdit);

        WebInspector.setCurrentFocusElement(this._previousFocusElement);
        delete this._previousFocusElement;
        delete this._anchorElement;
        if (this._view) {
            this._view.detach();
            this._view.contentElement.removeEventListener("keydown", this._boundOnKeyDown, false);
            this._view.contentElement.removeEventListener("focusout", this._boundFocusOut, false);
            delete this._view;
        }
    },

    /**
     * @param {!Event} event
     */
    _onKeyDown: function(event)
    {
        if (event.keyIdentifier === "Enter") {
            this.hide(true);
            event.consume(true);
            return;
        }
        if (event.keyIdentifier === "U+001B") { // Escape key
            this.hide(false);
            event.consume(true);
        }
    },

    __proto__: WebInspector.Object.prototype
}

/**
 * @constructor
 * @param {!WebInspector.StylePropertyTreeElement} treeElement
 * @param {!WebInspector.StylesPopoverHelper} stylesPopoverHelper
 * @param {string} text
 */
WebInspector.BezierPopoverIcon = function(treeElement, stylesPopoverHelper, text)
{
    this._treeElement = treeElement;
    this._stylesPopoverHelper = stylesPopoverHelper;
    this._createDOM(text);

    this._boundBezierChanged = this._bezierChanged.bind(this);
}

WebInspector.BezierPopoverIcon.prototype = {
    /**
     * @return {!Element}
     */
    element: function()
    {
        return this._element;
    },

    /**
     * @param {string} text
     */
    _createDOM: function(text)
    {
        this._element = createElement("nobr");
        this._element.title = WebInspector.UIString("Open cubic bezier editor");

        this._iconElement = this._element.createChild("div", "popover-icon bezier-icon");
        var svg = this._iconElement.createSVGChild("svg");
        svg.setAttribute("height", 10);
        svg.setAttribute("width", 10);
        this._iconElement.addEventListener("click", this._iconClick.bind(this), false);
        var g = svg.createSVGChild("g");
        var path = g.createSVGChild("path");
        path.setAttribute("d", "M2,8 C2,3 8,7 8,2");

        this._bezierValueElement = this._element.createChild("span");
        this._bezierValueElement.textContent = text;
    },

    /**
     * @param {!Event} event
     */
    _iconClick: function(event)
    {
        event.consume(true);
        if (this._stylesPopoverHelper.isShowing()) {
            this._stylesPopoverHelper.hide(true);
            return;
        }

        this._bezierEditor = new WebInspector.BezierEditor();
        var geometry = WebInspector.Geometry.CubicBezier.parse(this._bezierValueElement.textContent);
        this._bezierEditor.setBezier(geometry);
        this._bezierEditor.addEventListener(WebInspector.BezierEditor.Events.BezierChanged, this._boundBezierChanged);
        this._stylesPopoverHelper.show(this._bezierEditor, this._iconElement, this._onPopoverHidden.bind(this));

        this._originalPropertyText = this._treeElement.property.propertyText;
        this._treeElement.parentPane().setEditingStyle(true);
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _bezierChanged: function(event)
    {
        this._bezierValueElement.textContent = /** @type {string} */ (event.data);
        this._treeElement.applyStyleText(this._treeElement.renderedPropertyText(), false);
    },

    /**
     * @param {boolean} commitEdit
     */
    _onPopoverHidden: function(commitEdit)
    {
        this._bezierEditor.removeEventListener(WebInspector.BezierEditor.Events.BezierChanged, this._boundBezierChanged);
        delete this._bezierEditor;

        var propertyText = commitEdit ? this._treeElement.renderedPropertyText() : this._originalPropertyText;
        this._treeElement.applyStyleText(propertyText, true);
        this._treeElement.parentPane().setEditingStyle(false);
        delete this._originalPropertyText;
    }
}

/**
 * @constructor
 * @param {!WebInspector.StylePropertyTreeElement} treeElement
 * @param {!WebInspector.StylesPopoverHelper} stylesPopoverHelper
 * @param {string} colorText
 */
WebInspector.ColorSwatchPopoverIcon = function(treeElement, stylesPopoverHelper, colorText)
{
    this._treeElement = treeElement;
    this._treeElement[WebInspector.ColorSwatchPopoverIcon._treeElementSymbol] = this;
    this._stylesPopoverHelper = stylesPopoverHelper;

    this._swatch = WebInspector.ColorSwatch.create();
    this._swatch.setColorText(colorText);
    this._swatch.setFormat(WebInspector.Color.detectColorFormat(this._swatch.color()));
    var shiftClickMessage = WebInspector.UIString("Shift + Click to change color format.");
    this._swatch.iconElement().title = WebInspector.UIString("Open color picker. %s", shiftClickMessage);
    this._swatch.iconElement().addEventListener("click", this._iconClick.bind(this));
    this._contrastColor = null;

    this._boundSpectrumChanged = this._spectrumChanged.bind(this);
}

WebInspector.ColorSwatchPopoverIcon._treeElementSymbol = Symbol("WebInspector.ColorSwatchPopoverIcon._treeElementSymbol");

/**
 * @param {!WebInspector.StylePropertyTreeElement} treeElement
 * @return {?WebInspector.ColorSwatchPopoverIcon}
 */
WebInspector.ColorSwatchPopoverIcon.forTreeElement = function(treeElement)
{
    return treeElement[WebInspector.ColorSwatchPopoverIcon._treeElementSymbol] || null;
}

WebInspector.ColorSwatchPopoverIcon.prototype = {
    /**
     * @return {!Element}
     */
    element: function()
    {
        return this._swatch;
    },

    /**
     * @param {!WebInspector.Color} color
     */
    setContrastColor: function(color)
    {
        this._contrastColor = color;
        if (this._spectrum)
            this._spectrum.setContrastColor(this._contrastColor);
    },

    /**
     * @param {!Event} event
     */
    _iconClick: function(event)
    {
        event.consume(true);
        this.showPopover();
    },

    showPopover: function()
    {
        if (this._stylesPopoverHelper.isShowing()) {
            this._stylesPopoverHelper.hide(true);
            return;
        }

        var color = this._swatch.color();
        var format = this._swatch.format();
        if (format === WebInspector.Color.Format.Original)
            format = color.format();
        this._spectrum = new WebInspector.Spectrum();
        this._spectrum.setColor(color, format);
        if (this._contrastColor)
            this._spectrum.setContrastColor(this._contrastColor);

        this._spectrum.addEventListener(WebInspector.Spectrum.Events.SizeChanged, this._spectrumResized, this);
        this._spectrum.addEventListener(WebInspector.Spectrum.Events.ColorChanged, this._boundSpectrumChanged);
        this._stylesPopoverHelper.show(this._spectrum, this._swatch.iconElement(), this._onPopoverHidden.bind(this));

        this._originalPropertyText = this._treeElement.property.propertyText;
        this._treeElement.parentPane().setEditingStyle(true);
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _spectrumResized: function(event)
    {
        this._stylesPopoverHelper.reposition();
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _spectrumChanged: function(event)
    {
        var colorString = /** @type {string} */ (event.data);
        this._swatch.setColorText(colorString);
        this._treeElement.applyStyleText(this._treeElement.renderedPropertyText(), false);
    },

    /**
     * @param {boolean} commitEdit
     */
    _onPopoverHidden: function(commitEdit)
    {
        this._spectrum.removeEventListener(WebInspector.Spectrum.Events.ColorChanged, this._boundSpectrumChanged);
        delete this._spectrum;

        var propertyText = commitEdit ? this._treeElement.renderedPropertyText() : this._originalPropertyText;
        this._treeElement.applyStyleText(propertyText, true);
        this._treeElement.parentPane().setEditingStyle(false);
        delete this._originalPropertyText;
    }
}
;/* BezierEditor.js */
// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @constructor
 * @extends {WebInspector.VBox}
 */
WebInspector.BezierEditor = function()
{
    WebInspector.VBox.call(this, true);
    this.registerRequiredCSS("elements/bezierEditor.css");
    this.contentElement.tabIndex = 0;

    // Preview UI
    this._previewElement = this.contentElement.createChild("div", "bezier-preview-container");
    this._previewElement.createChild("div", "bezier-preview-animation");
    this._previewElement.addEventListener("click", this._startPreviewAnimation.bind(this));
    this._previewOnion = this.contentElement.createChild("div", "bezier-preview-onion");
    this._previewOnion.addEventListener("click", this._startPreviewAnimation.bind(this));

    this._outerContainer = this.contentElement.createChild("div", "bezier-container");

    // Presets UI
    this._presetsContainer = this._outerContainer.createChild("div", "bezier-presets");
    this._presetUI = new WebInspector.BezierUI(40, 40, 0, 2, false);
    this._presetCategories = [];
    for (var i = 0; i < WebInspector.BezierEditor.Presets.length; i++) {
        this._presetCategories[i] = this._createCategory(WebInspector.BezierEditor.Presets[i]);
        this._presetsContainer.appendChild(this._presetCategories[i].icon);
    }

    // Curve UI
    this._curveUI = new WebInspector.BezierUI(150, 250, 50, 7, true);
    this._curve = this._outerContainer.createSVGChild("svg", "bezier-curve");
    WebInspector.installDragHandle(this._curve, this._dragStart.bind(this), this._dragMove.bind(this), this._dragEnd.bind(this), "default");

    this._header = this.contentElement.createChild("div", "bezier-header");
    var minus = this._createPresetModifyIcon(this._header, "bezier-preset-minus", "M 12 6 L 8 10 L 12 14");
    var plus = this._createPresetModifyIcon(this._header, "bezier-preset-plus", "M 8 6 L 12 10 L 8 14");
    minus.addEventListener("click", this._presetModifyClicked.bind(this, false));
    plus.addEventListener("click", this._presetModifyClicked.bind(this, true));
    this._label = this._header.createChild("span", "source-code bezier-display-value");
}

WebInspector.BezierEditor.Events = {
    BezierChanged: "BezierChanged"
}

WebInspector.BezierEditor.Presets = [
    [
        { name: "ease-in-out", value: "ease-in-out" },
        { name: "In Out · Sine", value: "cubic-bezier(0.45, 0.05, 0.55, 0.95)" },
        { name: "In Out · Quadratic", value: "cubic-bezier(0.46, 0.03, 0.52, 0.96)" },
        { name: "In Out · Cubic", value: "cubic-bezier(0.65, 0.05, 0.36, 1)" },
        { name: "Fast Out, Slow In", value: "cubic-bezier(0.4, 0, 0.2, 1)" },
        { name: "In Out · Back", value: "cubic-bezier(0.68, -0.55, 0.27, 1.55)" }
    ],
    [
        { name: "Fast Out, Linear In", value: "cubic-bezier(0.4, 0, 1, 1)" },
        { name: "ease-in", value: "ease-in" },
        { name: "In · Sine", value: "cubic-bezier(0.47, 0, 0.75, 0.72)" },
        { name: "In · Quadratic", value: "cubic-bezier(0.55, 0.09, 0.68, 0.53)" },
        { name: "In · Cubic", value: "cubic-bezier(0.55, 0.06, 0.68, 0.19)" },
        { name: "In · Back", value: "cubic-bezier(0.6, -0.28, 0.74, 0.05)" }
    ],
    [
        { name: "ease-out", value: "ease-out" },
        { name: "Out · Sine", value: "cubic-bezier(0.39, 0.58, 0.57, 1)" },
        { name: "Out · Quadratic", value: "cubic-bezier(0.25, 0.46, 0.45, 0.94)" },
        { name: "Out · Cubic", value: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
        { name: "Linear Out, Slow In", value: "cubic-bezier(0, 0, 0.2, 1)" },
        { name: "Out · Back", value: "cubic-bezier(0.18, 0.89, 0.32, 1.28)" }
    ]
]

/** @typedef {{presets: !Array.<{name: string, value: string}>, icon: !Element, presetIndex: number}} */
WebInspector.BezierEditor.PresetCategory;

WebInspector.BezierEditor.prototype = {
    /**
     * @param {?WebInspector.Geometry.CubicBezier} bezier
     */
    setBezier: function(bezier)
    {
        if (!bezier)
            return;
        this._bezier = bezier;
        this._updateUI();
    },

    /**
     * @return {!WebInspector.Geometry.CubicBezier}
     */
    bezier: function()
    {
        return this._bezier;
    },

    wasShown: function()
    {
        this._unselectPresets();
        // Check if bezier matches a preset
        for (var category of this._presetCategories) {
            for (var i = 0; i < category.presets.length; i++) {
                if (this._bezier.asCSSText() === category.presets[i].value) {
                    category.presetIndex = i;
                    this._presetCategorySelected(category);
                }
            }
        }

        this._updateUI();
        this._startPreviewAnimation();
    },

    _onchange: function()
    {
        this._updateUI();
        this.dispatchEventToListeners(WebInspector.BezierEditor.Events.BezierChanged, this._bezier.asCSSText());
    },

    _updateUI: function()
    {
        var labelText = this._selectedCategory ? this._selectedCategory.presets[this._selectedCategory.presetIndex].name : this._bezier.asCSSText().replace(/\s(-\d\.\d)/g, "$1");
        this._label.textContent = WebInspector.UIString(labelText);
        this._curveUI.drawCurve(this._bezier, this._curve);
        this._previewOnion.removeChildren();
    },

    /**
     * @param {!Event} event
     * @return {boolean}
     */
    _dragStart: function(event)
    {
        this._mouseDownPosition = new WebInspector.Geometry.Point(event.x, event.y);
        var ui = this._curveUI;
        this._controlPosition = new WebInspector.Geometry.Point(
            Number.constrain((event.offsetX - ui.radius) / ui.curveWidth(), 0, 1),
            (ui.curveHeight() + ui.marginTop + ui.radius - event.offsetY) / ui.curveHeight());

        var firstControlPointIsCloser = this._controlPosition.distanceTo(this._bezier.controlPoints[0]) < this._controlPosition.distanceTo(this._bezier.controlPoints[1]);
        this._selectedPoint = firstControlPointIsCloser ? 0 : 1;

        this._bezier.controlPoints[this._selectedPoint] = this._controlPosition;
        this._unselectPresets();
        this._onchange();

        event.consume(true);
        return true;
    },

    /**
     * @param {number} mouseX
     * @param {number} mouseY
     */
    _updateControlPosition: function(mouseX, mouseY)
    {
        var deltaX = (mouseX - this._mouseDownPosition.x) / this._curveUI.curveWidth();
        var deltaY = (mouseY - this._mouseDownPosition.y) / this._curveUI.curveHeight();
        var newPosition = new WebInspector.Geometry.Point(Number.constrain(this._controlPosition.x + deltaX, 0, 1), this._controlPosition.y - deltaY);
        this._bezier.controlPoints[this._selectedPoint] = newPosition;
    },

    /**
     * @param {!Event} event
     */
    _dragMove: function(event)
    {
        this._updateControlPosition(event.x, event.y);
        this._onchange();
    },

    /**
     * @param {!Event} event
     */
    _dragEnd: function(event)
    {
        this._updateControlPosition(event.x, event.y);
        this._onchange();
        this._startPreviewAnimation();
    },

    /**
     * @param {!Array<{name: string, value: string}>} presetGroup
     * @return {!WebInspector.BezierEditor.PresetCategory}
     */
    _createCategory: function(presetGroup)
    {
        var presetElement = createElementWithClass("div", "bezier-preset-category");
        var iconElement = presetElement.createSVGChild("svg", "bezier-preset monospace");
        var category = { presets: presetGroup, presetIndex: 0, icon: presetElement };
        this._presetUI.drawCurve(WebInspector.Geometry.CubicBezier.parse(category.presets[0].value), iconElement);
        iconElement.addEventListener("click", this._presetCategorySelected.bind(this, category));
        return category;
    },

    /**
     * @param {!Element} parentElement
     * @param {string} className
     * @param {string} drawPath
     * @return {!Element}
     */
    _createPresetModifyIcon: function (parentElement, className, drawPath)
    {
        var icon = parentElement.createSVGChild("svg", "bezier-preset-modify " + className);
        icon.setAttribute("width", 20);
        icon.setAttribute("height", 20);
        var path = icon.createSVGChild("path");
        path.setAttribute("d", drawPath);
        return icon;
    },

    _unselectPresets: function()
    {
        for (var category of this._presetCategories)
            category.icon.classList.remove("bezier-preset-selected");
        delete this._selectedCategory;
        this._header.classList.remove("bezier-header-active");
    },

    /**
     * @param {!WebInspector.BezierEditor.PresetCategory} category
     * @param {!Event=} event
     */
    _presetCategorySelected: function(category, event)
    {
        if (this._selectedCategory === category)
            return;
        this._unselectPresets();
        this._header.classList.add("bezier-header-active");
        this._selectedCategory = category;
        this._selectedCategory.icon.classList.add("bezier-preset-selected");
        this.setBezier(WebInspector.Geometry.CubicBezier.parse(category.presets[category.presetIndex].value));
        this._onchange();
        this._startPreviewAnimation();
        if (event)
            event.consume(true);
    },

    /**
     * @param {boolean} intensify
     * @param {!Event} event
     */
    _presetModifyClicked: function(intensify, event)
    {
        if (!this._selectedCategory)
            return;

        var length = this._selectedCategory.presets.length;
        this._selectedCategory.presetIndex = (this._selectedCategory.presetIndex + (intensify ? 1 : -1) + length) % length;
        this.setBezier(WebInspector.Geometry.CubicBezier.parse(this._selectedCategory.presets[this._selectedCategory.presetIndex].value));
        this._onchange();
        this._startPreviewAnimation();
    },

    _startPreviewAnimation: function()
    {
        if (this._previewAnimation)
            this._previewAnimation.cancel();

        const animationDuration = 1600;
        const numberOnionSlices = 20;

        var keyframes = [{ offset: 0, transform: "translateX(0px)", easing: this._bezier.asCSSText(), opacity: 1 },
            { offset: 0.9, transform: "translateX(218px)", opacity: 1 },
            { offset: 1, transform: "translateX(218px)", opacity: 0 }];
        this._previewAnimation = this._previewElement.animate(keyframes, animationDuration);
        this._previewOnion.removeChildren();
        for (var i = 0; i <= numberOnionSlices; i++) {
            var slice = this._previewOnion.createChild("div", "bezier-preview-animation");
            var player = slice.animate([{ transform: "translateX(0px)", easing: this._bezier.asCSSText() }, { transform: "translateX(218px)" }],
                { duration: animationDuration, fill: "forwards" });
            player.pause();
            player.currentTime = animationDuration * i / numberOnionSlices;
        }
    },

    __proto__: WebInspector.VBox.prototype
}
;/* Spectrum.js */
/*
 * Copyright (C) 2011 Brian Grinstead All rights reserved.
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
 */
WebInspector.Spectrum = function()
{
    /**
     * @param {!Element} parentElement
     */
    function appendSwitcherIcon(parentElement)
    {
        var icon = parentElement.createSVGChild("svg");
        icon.setAttribute("height", 16);
        icon.setAttribute("width", 16);
        var path = icon.createSVGChild("path");
        path.setAttribute("d", "M5,6 L11,6 L8,2 Z M5,10 L11,10 L8,14 Z");
        return icon;
    }

    WebInspector.VBox.call(this, true);
    this.registerRequiredCSS("elements/spectrum.css");
    this.contentElement.tabIndex = 0;

    this._colorElement = this.contentElement.createChild("div", "spectrum-color");
    this._colorDragElement = this._colorElement.createChild("div", "spectrum-sat fill").createChild("div", "spectrum-val fill").createChild("div", "spectrum-dragger");
    var contrastRatioSVG = this._colorElement.createSVGChild("svg", "spectrum-contrast-container fill");
    this._contrastRatioLine = contrastRatioSVG.createSVGChild("path", "spectrum-contrast-line");

    var toolbar = new WebInspector.Toolbar("spectrum-eye-dropper", this.contentElement);
    this._colorPickerButton = new WebInspector.ToolbarToggle(WebInspector.UIString("Toggle color picker"), "eyedropper-toolbar-item");
    this._colorPickerButton.setToggled(true);
    this._colorPickerButton.addEventListener("click", this._toggleColorPicker.bind(this, undefined));
    toolbar.appendToolbarItem(this._colorPickerButton);

    var swatchElement = this.contentElement.createChild("span", "swatch");
    this._swatchInnerElement = swatchElement.createChild("span", "swatch-inner");

    this._hueElement = this.contentElement.createChild("div", "spectrum-hue");
    this._hueSlider = this._hueElement.createChild("div", "spectrum-slider");
    this._alphaElement = this.contentElement.createChild("div", "spectrum-alpha");
    this._alphaElementBackground = this._alphaElement.createChild("div", "spectrum-alpha-background");
    this._alphaSlider = this._alphaElement.createChild("div", "spectrum-slider");

    var displaySwitcher = this.contentElement.createChild("div", "spectrum-display-switcher spectrum-switcher");
    appendSwitcherIcon(displaySwitcher);
    displaySwitcher.addEventListener("click", this._formatViewSwitch.bind(this));

    // RGBA/HSLA display.
    this._displayContainer = this.contentElement.createChild("div", "spectrum-text source-code");
    this._textValues = [];
    for (var i = 0; i < 4; ++i) {
        var inputValue = this._displayContainer.createChild("input", "spectrum-text-value");
        inputValue.maxLength = 4;
        this._textValues.push(inputValue);
        inputValue.addEventListener("keydown", this._inputChanged.bind(this), false);
        inputValue.addEventListener("input", this._inputChanged.bind(this), false);
        inputValue.addEventListener("mousewheel", this._inputChanged.bind(this), false);
    }

    this._textLabels = this._displayContainer.createChild("div", "spectrum-text-label");

    // HEX display.
    this._hexContainer = this.contentElement.createChild("div", "spectrum-text spectrum-text-hex source-code");
    this._hexValue = this._hexContainer.createChild("input", "spectrum-text-value");
    this._hexValue.maxLength = 7;
    this._hexValue.addEventListener("keydown", this._inputChanged.bind(this), false);
    this._hexValue.addEventListener("input", this._inputChanged.bind(this), false);
    this._hexValue.addEventListener("mousewheel", this._inputChanged.bind(this), false);

    var label = this._hexContainer.createChild("div", "spectrum-text-label");
    label.textContent = "HEX";

    WebInspector.installDragHandle(this._hueElement, dragStart.bind(this, positionHue.bind(this)), positionHue.bind(this), null, "default");
    WebInspector.installDragHandle(this._alphaElement, dragStart.bind(this, positionAlpha.bind(this)), positionAlpha.bind(this), null, "default");
    WebInspector.installDragHandle(this._colorElement, dragStart.bind(this, positionColor.bind(this)), positionColor.bind(this), null, "default");

    this.element.classList.add("palettes-enabled");
    /** @type {!Map.<string, !WebInspector.Spectrum.Palette>} */
    this._palettes = new Map();
    this._palettePanel = this.contentElement.createChild("div", "palette-panel");
    this._palettePanelShowing = false;
    this._paletteContainer = this.contentElement.createChild("div", "spectrum-palette");
    this._paletteContainer.addEventListener("contextmenu", this._showPaletteColorContextMenu.bind(this, -1));
    this._shadesContainer = this.contentElement.createChild("div", "palette-color-shades hidden");
    WebInspector.installDragHandle(this._paletteContainer, this._paletteDragStart.bind(this), this._paletteDrag.bind(this), this._paletteDragEnd.bind(this), "default");
    var paletteSwitcher = this.contentElement.createChild("div", "spectrum-palette-switcher spectrum-switcher");
    appendSwitcherIcon(paletteSwitcher);
    paletteSwitcher.addEventListener("click", this._togglePalettePanel.bind(this, true));

    this._deleteIconToolbar = new WebInspector.Toolbar("delete-color-toolbar");
    this._deleteButton = new WebInspector.ToolbarButton("", "garbage-collect-toolbar-item");
    this._deleteIconToolbar.appendToolbarItem(this._deleteButton);

    var overlay = this.contentElement.createChild("div", "spectrum-overlay fill");
    overlay.addEventListener("click", this._togglePalettePanel.bind(this, false));

    this._addColorToolbar = new WebInspector.Toolbar("add-color-toolbar");
    var addColorButton = new WebInspector.ToolbarButton(WebInspector.UIString("Add to palette"), "add-toolbar-item");
    addColorButton.addEventListener("click", this._addColorToCustomPalette.bind(this));
    this._addColorToolbar.appendToolbarItem(addColorButton);

    this._loadPalettes();
    new WebInspector.Spectrum.PaletteGenerator(this._generatedPaletteLoaded.bind(this));

    /**
     * @param {function(!Event)} callback
     * @param {!Event} event
     * @return {boolean}
     * @this {WebInspector.Spectrum}
     */
    function dragStart(callback, event)
    {
        this._hueAlphaLeft = this._hueElement.totalOffsetLeft();
        this._colorOffset = this._colorElement.totalOffset();
        callback(event);
        return true;
    }

    /**
     * @param {!Event} event
     * @this {WebInspector.Spectrum}
     */
    function positionHue(event)
    {
        var hsva = this._hsv.slice();
        hsva[0] = Number.constrain(1 - (event.x - this._hueAlphaLeft) / this._hueAlphaWidth, 0, 1);
        this._innerSetColor(hsva,  "", undefined, WebInspector.Spectrum._ChangeSource.Other);
    }

    /**
     * @param {!Event} event
     * @this {WebInspector.Spectrum}
     */
    function positionAlpha(event)
    {
        var newAlpha = Math.round((event.x - this._hueAlphaLeft) / this._hueAlphaWidth * 100) / 100;
        var hsva = this._hsv.slice();
        hsva[3] = Number.constrain(newAlpha, 0, 1);
        var colorFormat = undefined;
        if (hsva[3] !== 1 && (this._colorFormat === WebInspector.Color.Format.ShortHEX || this._colorFormat === WebInspector.Color.Format.HEX || this._colorFormat === WebInspector.Color.Format.Nickname))
            colorFormat = WebInspector.Color.Format.RGB;
        this._innerSetColor(hsva, "", colorFormat, WebInspector.Spectrum._ChangeSource.Other);
    }

    /**
     * @param {!Event} event
     * @this {WebInspector.Spectrum}
     */
    function positionColor(event)
    {
        var hsva = this._hsv.slice();
        hsva[1] = Number.constrain((event.x - this._colorOffset.left) / this.dragWidth, 0, 1);
        hsva[2] = Number.constrain(1 - (event.y - this._colorOffset.top) / this.dragHeight, 0, 1);
        this._innerSetColor(hsva,  "", undefined, WebInspector.Spectrum._ChangeSource.Other);
    }
}

WebInspector.Spectrum._ChangeSource = {
    Input: "Input",
    Model: "Model",
    Other: "Other"
}

WebInspector.Spectrum.Events = {
    ColorChanged: "ColorChanged",
    SizeChanged: "SizeChanged"
};

WebInspector.Spectrum._colorChipSize = 24;
WebInspector.Spectrum._itemsPerPaletteRow = 8;

WebInspector.Spectrum.prototype = {
    _updatePalettePanel: function()
    {
        this._palettePanel.removeChildren();
        var title = this._palettePanel.createChild("div", "palette-title");
        title.textContent = WebInspector.UIString("Color Palettes");
        var toolbar = new WebInspector.Toolbar("", this._palettePanel);
        var closeButton = new WebInspector.ToolbarButton("Return to color picker", "delete-toolbar-item");
        closeButton.addEventListener("click", this._togglePalettePanel.bind(this, false));
        toolbar.appendToolbarItem(closeButton);
        for (var palette of this._palettes.values())
            this._palettePanel.appendChild(this._createPreviewPaletteElement(palette));
    },

    /**
     * @param {boolean} show
     */
    _togglePalettePanel: function(show)
    {
        if (this._palettePanelShowing === show)
            return;
        if (show)
            this._updatePalettePanel();
        this._focus();
        this._palettePanelShowing = show;
        this.contentElement.classList.toggle("palette-panel-showing", show);
    },

    _focus: function()
    {
        if (this.isShowing() && WebInspector.currentFocusElement() !== this.contentElement)
            WebInspector.setCurrentFocusElement(this.contentElement);
    },

    /**
     * @param {string} colorText
     * @param {number=} animationDelay
     * @return {!Element}
     */
    _createPaletteColor: function(colorText, animationDelay)
    {
        var element = createElementWithClass("div", "spectrum-palette-color");
        element.style.background = String.sprintf("linear-gradient(%s, %s), url(Images/checker.png)", colorText, colorText);
        if (animationDelay)
            element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 100, delay: animationDelay, fill: "backwards" });
        element.title = colorText;
        return element;
    },

    /**
     * @param {!WebInspector.Spectrum.Palette} palette
     * @param {boolean} animate
     * @param {!Event=} event
     */
    _showPalette: function(palette, animate, event)
    {
        this._resizeForSelectedPalette();
        this._paletteContainer.removeChildren();
        for (var i = 0; i < palette.colors.length; i++) {
            var animationDelay = animate ? i * 100 / palette.colors.length : 0;
            var colorElement = this._createPaletteColor(palette.colors[i], animationDelay);
            colorElement.addEventListener("mousedown", this._paletteColorSelected.bind(this, palette.colors[i], palette.matchUserFormat));
            if (palette.mutable) {
                colorElement.__mutable = true;
                colorElement.__color = palette.colors[i];
                colorElement.addEventListener("contextmenu", this._showPaletteColorContextMenu.bind(this, i));
            } else if (palette === WebInspector.Spectrum.MaterialPalette) {
                colorElement.classList.add("has-material-shades");
                var shadow = colorElement.createChild("div", "spectrum-palette-color spectrum-palette-color-shadow");
                shadow.style.background = palette.colors[i];
                shadow = colorElement.createChild("div", "spectrum-palette-color spectrum-palette-color-shadow");
                shadow.style.background = palette.colors[i];
                colorElement.title = WebInspector.UIString(palette.colors[i] + ". Long-click to show alternate shades.");
                new WebInspector.LongClickController(colorElement, this._showLightnessShades.bind(this, colorElement, palette.colors[i]));
            }
            this._paletteContainer.appendChild(colorElement);
        }
        this._paletteContainerMutable = palette.mutable;

        var numItems = palette.colors.length;
        if (palette.mutable)
            numItems++;
        if (palette.mutable) {
            this._paletteContainer.appendChild(this._addColorToolbar.element);
            this._paletteContainer.appendChild(this._deleteIconToolbar.element);
        } else {
            this._addColorToolbar.element.remove();
            this._deleteIconToolbar.element.remove();
        }

        this._togglePalettePanel(false);
        this._focus();
    },

    /**
     * @param {!Element} colorElement
     * @param {string} colorText
     * @param {!Event} event
     */
    _showLightnessShades: function(colorElement, colorText, event)
    {
        /**
         * @param {!Element} element
         * @this {!WebInspector.Spectrum}
         */
        function closeLightnessShades(element)
        {
            this._shadesContainer.classList.add("hidden");
            element.classList.remove("spectrum-shades-shown");
            this._shadesContainer.ownerDocument.removeEventListener("mousedown", this._shadesCloseHandler, true);
            delete this._shadesCloseHandler;
        }

        if (this._shadesCloseHandler)
            this._shadesCloseHandler();

        this._shadesContainer.classList.remove("hidden");
        this._shadesContainer.removeChildren();
        this._shadesContainer.animate([{ transform: "scaleY(0)", opacity: "0" }, { transform: "scaleY(1)", opacity: "1" }], { duration: 200, easing: "cubic-bezier(0.4, 0, 0.2, 1)" });
        this._shadesContainer.style.top = colorElement.offsetTop + colorElement.parentElement.offsetTop + "px";
        this._shadesContainer.style.left = colorElement.offsetLeft + "px";
        colorElement.classList.add("spectrum-shades-shown");

        var shades = WebInspector.Spectrum.MaterialPaletteShades[colorText];
        for (var i = shades.length - 1; i >= 0; i--) {
            var shadeElement = this._createPaletteColor(shades[i], i * 200 / shades.length + 100);
            shadeElement.addEventListener("mousedown", this._paletteColorSelected.bind(this, shades[i], false));
            this._shadesContainer.appendChild(shadeElement);
        }

        WebInspector.setCurrentFocusElement(this._shadesContainer);
        this._shadesCloseHandler = closeLightnessShades.bind(this, colorElement);
        this._shadesContainer.ownerDocument.addEventListener("mousedown", this._shadesCloseHandler, true);
    },

    /**
     * @param {!Event} e
     * @return {number}
     */
    _slotIndexForEvent: function(e)
    {
        var localX = e.pageX - this._paletteContainer.totalOffsetLeft();
        var localY = e.pageY - this._paletteContainer.totalOffsetTop();
        var col = Math.min(localX / WebInspector.Spectrum._colorChipSize | 0, WebInspector.Spectrum._itemsPerPaletteRow - 1);
        var row = (localY / WebInspector.Spectrum._colorChipSize) | 0;
        return Math.min(row * WebInspector.Spectrum._itemsPerPaletteRow + col, this._customPaletteSetting.get().colors.length - 1);
    },

    /**
     * @param {!Event} e
     * @return {boolean}
     */
    _isDraggingToBin: function(e)
    {
        return e.pageX > this._deleteIconToolbar.element.totalOffsetLeft();
    },

    /**
     * @param {!Event} e
     * @return {boolean}
     */
    _paletteDragStart: function(e)
    {
        var element = e.deepElementFromPoint();
        if (!element || !element.__mutable)
            return false;

        var index = this._slotIndexForEvent(e);
        this._dragElement = element;
        this._dragHotSpotX = e.pageX - (index % WebInspector.Spectrum._itemsPerPaletteRow) * WebInspector.Spectrum._colorChipSize;
        this._dragHotSpotY = e.pageY - (index / WebInspector.Spectrum._itemsPerPaletteRow | 0) * WebInspector.Spectrum._colorChipSize;
        return true;
    },

    /**
     * @param {!Event} e
     */
    _paletteDrag: function(e)
    {
        if (e.pageX < this._paletteContainer.totalOffsetLeft() || e.pageY < this._paletteContainer.totalOffsetTop())
            return;
        var newIndex = this._slotIndexForEvent(e);
        var offsetX = e.pageX - (newIndex % WebInspector.Spectrum._itemsPerPaletteRow) * WebInspector.Spectrum._colorChipSize;
        var offsetY = e.pageY - (newIndex / WebInspector.Spectrum._itemsPerPaletteRow | 0) * WebInspector.Spectrum._colorChipSize;

        var isDeleting = this._isDraggingToBin(e);
        this._deleteIconToolbar.element.classList.add("dragging");
        this._deleteIconToolbar.element.classList.toggle("delete-color-toolbar-active", isDeleting);
        var dragElementTransform = "translateX(" + (offsetX - this._dragHotSpotX) + "px) translateY(" + (offsetY - this._dragHotSpotY) + "px)";
        this._dragElement.style.transform = isDeleting ? dragElementTransform + " scale(0.8)" : dragElementTransform;
        var children = Array.prototype.slice.call(this._paletteContainer.children);
        var index = children.indexOf(this._dragElement);
        /** @type {!Map.<!Element, {left: number, top: number}>} */
        var swatchOffsets = new Map();
        for (var swatch of children)
            swatchOffsets.set(swatch, swatch.totalOffset());

        if (index !== newIndex)
            this._paletteContainer.insertBefore(this._dragElement, children[newIndex > index ? newIndex + 1 : newIndex]);

        for (var swatch of children) {
            if (swatch === this._dragElement)
                continue;
            var before = swatchOffsets.get(swatch);
            var after = swatch.totalOffset();
            if (before.left !== after.left || before.top !== after.top) {
                swatch.animate([
                    { transform: "translateX(" + (before.left - after.left) + "px) translateY(" + (before.top - after.top) + "px)" },
                    { transform: "none" }], { duration: 100, easing: "cubic-bezier(0, 0, 0.2, 1)" });
            }
        }
    },

    /**
     * @param {!Event} e
     */
    _paletteDragEnd: function(e)
    {
        if (this._isDraggingToBin(e))
            this._dragElement.remove();
        this._dragElement.style.removeProperty("transform");
        var children = this._paletteContainer.children;
        var colors = [];
        for (var i = 0; i < children.length; ++i) {
            if (children[i].__color)
                colors.push(children[i].__color);
        }
        var palette = this._customPaletteSetting.get();
        palette.colors = colors;
        this._customPaletteSetting.set(palette);
        this._showPalette(this._customPaletteSetting.get(), false);

        this._deleteIconToolbar.element.classList.remove("dragging");
        this._deleteIconToolbar.element.classList.remove("delete-color-toolbar-active");
    },

    _loadPalettes: function()
    {
        this._palettes.set(WebInspector.Spectrum.MaterialPalette.title, WebInspector.Spectrum.MaterialPalette);
        /** @type {!WebInspector.Spectrum.Palette} */
        var defaultCustomPalette = { title: "Custom", colors: [], mutable: true };
        this._customPaletteSetting = WebInspector.settings.createSetting("customColorPalette", defaultCustomPalette);
        this._palettes.set(this._customPaletteSetting.get().title, this._customPaletteSetting.get());

        this._selectedColorPalette = WebInspector.settings.createSetting("selectedColorPalette", WebInspector.Spectrum.GeneratedPaletteTitle);
        var palette = this._palettes.get(this._selectedColorPalette.get());
        if (palette)
            this._showPalette(palette, true);
    },

    /**
     * @param {!WebInspector.Spectrum.Palette} generatedPalette
     */
    _generatedPaletteLoaded: function(generatedPalette)
    {
        if (generatedPalette.colors.length)
            this._palettes.set(generatedPalette.title, generatedPalette);
        if (this._selectedColorPalette.get() !== generatedPalette.title) {
            return;
        } else if (!generatedPalette.colors.length) {
            this._paletteSelected(WebInspector.Spectrum.MaterialPalette);
            return;
        }
        this._showPalette(generatedPalette, true);
    },

    /**
     * @param {!WebInspector.Spectrum.Palette} palette
     * @return {!Element}
     */
    _createPreviewPaletteElement: function(palette)
    {
        var colorsPerPreviewRow = 5;
        var previewElement = createElementWithClass("div", "palette-preview");
        var titleElement = previewElement.createChild("div", "palette-preview-title");
        titleElement.textContent = palette.title;
        for (var i = 0; i < colorsPerPreviewRow && i < palette.colors.length; i++)
            previewElement.appendChild(this._createPaletteColor(palette.colors[i]));
        for (; i < colorsPerPreviewRow; i++)
            previewElement.createChild("div", "spectrum-palette-color empty-color");
        previewElement.addEventListener("click", this._paletteSelected.bind(this, palette));
        return previewElement;
    },

    /**
     * @param {!WebInspector.Spectrum.Palette} palette
     */
    _paletteSelected: function(palette)
    {
        this._selectedColorPalette.set(palette.title);
        this._showPalette(palette, true);
    },

    _resizeForSelectedPalette: function()
    {
        var palette = this._palettes.get(this._selectedColorPalette.get());
        if (!palette)
            return;
        var numColors = palette.colors.length;
        if (palette === this._customPaletteSetting.get())
            numColors++;
        var rowsNeeded = Math.max(1, Math.ceil(numColors / WebInspector.Spectrum._itemsPerPaletteRow));
        if (this._numPaletteRowsShown === rowsNeeded)
            return;
        this._numPaletteRowsShown = rowsNeeded;
        var paletteColorHeight = 12;
        var paletteMargin = 12;
        var paletteTop = 235;
        this.element.style.height = (paletteTop + paletteMargin + (paletteColorHeight + paletteMargin) * rowsNeeded) + "px";
        this.dispatchEventToListeners(WebInspector.Spectrum.Events.SizeChanged);
    },

    /**
     * @param {string} colorText
     * @param {boolean} matchUserFormat
     */
    _paletteColorSelected: function(colorText, matchUserFormat)
    {
        var color = WebInspector.Color.parse(colorText);
        if (!color)
            return;
        this._innerSetColor(color.hsva(), colorText, matchUserFormat ? this._colorFormat :  color.format(), WebInspector.Spectrum._ChangeSource.Other);
    },

    _addColorToCustomPalette: function()
    {
        var palette = this._customPaletteSetting.get();
        palette.colors.push(this.colorString());
        this._customPaletteSetting.set(palette);
        this._showPalette(this._customPaletteSetting.get(), false);
    },

    /**
     * @param {number} colorIndex
     * @param {!Event} event
     */
    _showPaletteColorContextMenu: function(colorIndex, event)
    {
        if (!this._paletteContainerMutable)
            return;
        var contextMenu = new WebInspector.ContextMenu(event);
        if (colorIndex !== -1) {
            contextMenu.appendItem(WebInspector.UIString("Remove color"), this._deletePaletteColors.bind(this, colorIndex, false));
            contextMenu.appendItem(WebInspector.UIString("Remove all to the right"), this._deletePaletteColors.bind(this, colorIndex, true));
        }
        contextMenu.appendItem(WebInspector.UIString("Clear palette"), this._deletePaletteColors.bind(this, -1, true));
        contextMenu.show();
    },

    /**
     * @param {number} colorIndex
     * @param {boolean} toRight
     */
    _deletePaletteColors: function(colorIndex, toRight)
    {
        var palette = this._customPaletteSetting.get();
        if (toRight)
            palette.colors.splice(colorIndex + 1, palette.colors.length - colorIndex - 1);
        else
            palette.colors.splice(colorIndex, 1);
        this._customPaletteSetting.set(palette);
        this._showPalette(this._customPaletteSetting.get(), false);
    },

    /**
     * @param {!WebInspector.Color} color
     * @param {string} colorFormat
     */
    setColor: function(color, colorFormat)
    {
        this._originalFormat = colorFormat;
        this._innerSetColor(color.hsva(), "", colorFormat, WebInspector.Spectrum._ChangeSource.Model);
    },

    /**
     * @param {!Array<number>|undefined} hsva
     * @param {string|undefined} colorString
     * @param {string|undefined} colorFormat
     * @param {string} changeSource
     */
    _innerSetColor: function(hsva, colorString, colorFormat, changeSource)
    {
        if (hsva !== undefined)
            this._hsv = hsva;
        if (colorString !== undefined)
            this._colorString = colorString;
        if (colorFormat !== undefined) {
            console.assert(colorFormat !== WebInspector.Color.Format.Original, "Spectrum's color format cannot be Original");
            if (colorFormat === WebInspector.Color.Format.RGBA)
                colorFormat = WebInspector.Color.Format.RGB;
            else if (colorFormat === WebInspector.Color.Format.HSLA)
                colorFormat = WebInspector.Color.Format.HSL;
            this._colorFormat = colorFormat;
        }

        this._updateHelperLocations();
        this._updateUI();

        if (changeSource !== WebInspector.Spectrum._ChangeSource.Input)
            this._updateInput();
        if (changeSource !== WebInspector.Spectrum._ChangeSource.Model)
            this.dispatchEventToListeners(WebInspector.Spectrum.Events.ColorChanged, this.colorString());
    },

    /**
     * @param {!WebInspector.Color} color
     */
    setContrastColor: function(color)
    {
        this._contrastColor = color;
        this._updateUI();
    },

    /**
     * @return {!WebInspector.Color}
     */
    _color: function()
    {
        return WebInspector.Color.fromHSVA(this._hsv);
    },

    /**
     * @return {string}
     */
    colorString: function()
    {
        if (this._colorString)
            return this._colorString;
        var cf = WebInspector.Color.Format;
        var color = this._color();
        var colorString = color.asString(this._colorFormat);
        if (colorString)
            return colorString;

        if (this._colorFormat === cf.Nickname || this._colorFormat === cf.ShortHEX) {
            colorString = color.asString(cf.HEX);
            if (colorString)
                return colorString;
        }

        console.assert(color.hasAlpha());
        return this._colorFormat === cf.HSL ? /** @type {string} */(color.asString(cf.HSLA)) : /** @type {string} */(color.asString(cf.RGBA));
    },

    _updateHelperLocations: function()
    {
        var h = this._hsv[0];
        var s = this._hsv[1];
        var v = this._hsv[2];
        var alpha = this._hsv[3];

        // Where to show the little circle that displays your current selected color.
        var dragX = s * this.dragWidth;
        var dragY = this.dragHeight - (v * this.dragHeight);

        dragX = Math.max(-this._colorDragElementHeight,
                        Math.min(this.dragWidth - this._colorDragElementHeight, dragX - this._colorDragElementHeight));
        dragY = Math.max(-this._colorDragElementHeight,
                        Math.min(this.dragHeight - this._colorDragElementHeight, dragY - this._colorDragElementHeight));

        this._colorDragElement.positionAt(dragX, dragY);

        // Where to show the bar that displays your current selected hue.
        var hueSlideX = (1 - h) * this._hueAlphaWidth - this.slideHelperWidth;
        this._hueSlider.style.left = hueSlideX + "px";
        var alphaSlideX = alpha * this._hueAlphaWidth - this.slideHelperWidth;
        this._alphaSlider.style.left = alphaSlideX + "px";
    },

    _updateInput: function()
    {
        var cf = WebInspector.Color.Format;
        if (this._colorFormat === cf.HEX || this._colorFormat === cf.ShortHEX || this._colorFormat === cf.Nickname) {
            this._hexContainer.hidden = false;
            this._displayContainer.hidden = true;
            if (this._colorFormat === cf.ShortHEX && this._color().canBeShortHex())
                this._hexValue.value = this._color().asString(cf.ShortHEX);
            else
                this._hexValue.value = this._color().asString(cf.HEX);
        } else {
            // RGBA, HSLA display.
            this._hexContainer.hidden = true;
            this._displayContainer.hidden = false;
            var isRgb = this._colorFormat === cf.RGB;
            this._textLabels.textContent = isRgb ? "RGBA" : "HSLA";
            var colorValues = isRgb ? this._color().canonicalRGBA() : this._color().canonicalHSLA();
            for (var i = 0; i < 3; ++i) {
                this._textValues[i].value = colorValues[i];
                if (!isRgb && (i === 1 || i === 2))
                    this._textValues[i].value += "%";
            }
            this._textValues[3].value= Math.round(colorValues[3] * 100) / 100;
        }
    },

    /**
     * @param {number} requiredContrast
     */
    _drawContrastRatioLine: function(requiredContrast)
    {
        if (!this._contrastColor || !this.dragWidth || !this.dragHeight)
            return;

        /** const */ var width = this.dragWidth;
        /** const */ var height = this.dragHeight;
        /** const */ var dS = 0.02;
        /** const */ var epsilon = 0.002;
        /** const */ var H = 0;
        /** const */ var S = 1;
        /** const */ var V = 2;
        /** const */ var A = 3;

        var fgRGBA = [];
        WebInspector.Color.hsva2rgba(this._hsv, fgRGBA);
        var fgLuminance = WebInspector.Color.luminance(fgRGBA);
        var bgRGBA = this._contrastColor.rgba();
        var bgLuminance = WebInspector.Color.luminance(bgRGBA);
        var fgIsLighter = fgLuminance > bgLuminance;
        var desiredLuminance = WebInspector.Color.desiredLuminance(bgLuminance, requiredContrast, fgIsLighter);

        var lastV = this._hsv[V];
        var currentSlope = 0;
        var candidateHSVA = [this._hsv[H], 0, 0, this._hsv[A]];
        var pathBuilder = [];
        var candidateRGBA = [];
        WebInspector.Color.hsva2rgba(candidateHSVA, candidateRGBA);
        var blendedRGBA = [];
        WebInspector.Color.blendColors(candidateRGBA, bgRGBA, blendedRGBA);

        /**
         * Approach the desired contrast ratio by modifying the given component
         * from the given starting value.
         * @param {number} index
         * @param {number} x
         * @param {boolean} onAxis
         * @return {?number}
         */
        function approach(index, x, onAxis)
        {
            while (0 <= x && x <= 1) {
                candidateHSVA[index] = x;
                WebInspector.Color.hsva2rgba(candidateHSVA, candidateRGBA);
                WebInspector.Color.blendColors(candidateRGBA, bgRGBA, blendedRGBA);
                var fgLuminance = WebInspector.Color.luminance(blendedRGBA);
                var dLuminance = fgLuminance - desiredLuminance;

                if (Math.abs(dLuminance) < (onAxis ? epsilon / 10 : epsilon))
                    return x;
                else
                    x += (index === V ? -dLuminance : dLuminance);
            }
            return null;
        }

        for (var s = 0; s < 1 + dS; s += dS) {
            s = Math.min(1, s);
            candidateHSVA[S] = s;

            var v = lastV;
            v = lastV + currentSlope * dS;

            v = approach(V, v, s == 0);
            if (v === null)
                break;

            currentSlope = (v - lastV) / dS;

            pathBuilder.push(pathBuilder.length ? "L" : "M");
            pathBuilder.push(s * width);
            pathBuilder.push((1 - v) * height);
        }

        if (s < 1 + dS) {
            s -= dS;
            candidateHSVA[V] = 1;
            s = approach(S, s, true);
            if (s !== null)
                pathBuilder = pathBuilder.concat(["L", s * width, -1])
        }

        this._contrastRatioLine.setAttribute("d", pathBuilder.join(" "));
    },

    _updateUI: function()
    {
        var h = WebInspector.Color.fromHSVA([this._hsv[0], 1, 1, 1]);
        this._colorElement.style.backgroundColor = /** @type {string} */ (h.asString(WebInspector.Color.Format.RGB));
        if (Runtime.experiments.isEnabled("colorContrastRatio")) {
            // TODO(samli): Determine size of text and switch between AA/AAA ratings.
            this._drawContrastRatioLine(4.5);
        }
        this._swatchInnerElement.style.backgroundColor = /** @type {string} */ (this._color().asString(WebInspector.Color.Format.RGBA));
        // Show border if the swatch is white.
        this._swatchInnerElement.classList.toggle("swatch-inner-white", this._color().hsla()[2] > 0.9);
        this._colorDragElement.style.backgroundColor = /** @type {string} */ (this._color().asString(WebInspector.Color.Format.RGBA));
        var noAlpha = WebInspector.Color.fromHSVA(this._hsv.slice(0,3).concat(1));
        this._alphaElementBackground.style.backgroundImage = String.sprintf("linear-gradient(to right, rgba(0,0,0,0), %s)", noAlpha.asString(WebInspector.Color.Format.RGB));
    },

    _formatViewSwitch: function()
    {
        var cf = WebInspector.Color.Format;
        var format = cf.RGB;
        if (this._colorFormat === cf.RGB)
            format = cf.HSL;
        else if (this._colorFormat === cf.HSL && !this._color().hasAlpha())
            format = this._originalFormat === cf.ShortHEX ? cf.ShortHEX : cf.HEX;
        this._innerSetColor(undefined, "", format, WebInspector.Spectrum._ChangeSource.Other);
    },

    /**
     * @param {!Event} event
     */
    _inputChanged: function(event)
    {
        /**
         * @param {!Element} element
         * @return {string}
         */
        function elementValue(element)
        {
            return element.value;
        }

        var inputElement = /** @type {!Element} */(event.currentTarget);
        var arrowKeyOrMouseWheelEvent = (event.keyIdentifier === "Up" || event.keyIdentifier === "Down" || event.type === "mousewheel");
        var pageKeyPressed = (event.keyIdentifier === "PageUp" || event.keyIdentifier === "PageDown");
        if (arrowKeyOrMouseWheelEvent || pageKeyPressed) {
            var newValue = WebInspector.createReplacementString(inputElement.value, event);
            if (newValue) {
                inputElement.value = newValue;
                inputElement.selectionStart = 0;
                inputElement.selectionEnd = newValue.length;
            }
            event.consume(true);
        }

        const cf = WebInspector.Color.Format;
        var colorString;
        if (this._colorFormat === cf.HEX || this._colorFormat === cf.ShortHEX) {
            colorString = this._hexValue.value;
        } else {
            var format = this._colorFormat === cf.RGB ? "rgba" : "hsla";
            var values = this._textValues.map(elementValue).join(",");
            colorString = String.sprintf("%s(%s)", format, values);
        }

        var color = WebInspector.Color.parse(colorString);
        if (!color)
            return;
        var hsv = color.hsva();
        if (this._colorFormat === cf.HEX || this._colorFormat === cf.ShortHEX)
            this._colorFormat = color.canBeShortHex() ? cf.ShortHEX : cf.HEX;
        this._innerSetColor(hsv, colorString, undefined, WebInspector.Spectrum._ChangeSource.Input);
    },

    wasShown: function()
    {
        this._hueAlphaWidth = this._hueElement.offsetWidth;
        this.slideHelperWidth = this._hueSlider.offsetWidth / 2;
        this.dragWidth = this._colorElement.offsetWidth;
        this.dragHeight = this._colorElement.offsetHeight;
        this._colorDragElementHeight = this._colorDragElement.offsetHeight / 2;
        this._innerSetColor(undefined, undefined, undefined, WebInspector.Spectrum._ChangeSource.Model);
        this._toggleColorPicker(true);
        WebInspector.targetManager.addModelListener(WebInspector.ResourceTreeModel, WebInspector.ResourceTreeModel.EventTypes.ColorPicked, this._colorPicked, this);
    },

    willHide: function()
    {
        this._toggleColorPicker(false);
        WebInspector.targetManager.removeModelListener(WebInspector.ResourceTreeModel, WebInspector.ResourceTreeModel.EventTypes.ColorPicked, this._colorPicked, this);
    },

    /**
     * @param {boolean=} enabled
     * @param {!WebInspector.Event=} event
     */
    _toggleColorPicker: function(enabled, event)
    {
        if (enabled === undefined)
            enabled = !this._colorPickerButton.toggled();
        this._colorPickerButton.setToggled(enabled);
        for (var target of WebInspector.targetManager.targets())
            target.pageAgent().setColorPickerEnabled(enabled);
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _colorPicked: function(event)
    {
        var rgbColor = /** @type {!DOMAgent.RGBA} */ (event.data);
        var rgba = [rgbColor.r, rgbColor.g, rgbColor.b, (rgbColor.a / 2.55 | 0) / 100];
        var color = WebInspector.Color.fromRGBA(rgba);
        this._innerSetColor(color.hsva(), "", undefined, WebInspector.Spectrum._ChangeSource.Other);
        InspectorFrontendHost.bringToFront();
    },


    __proto__: WebInspector.VBox.prototype
}

/** @typedef {{ title: string, colors: !Array.<string>, mutable: boolean }} */
WebInspector.Spectrum.Palette;
WebInspector.Spectrum.GeneratedPaletteTitle = "Page colors";

/**
 * @constructor
 * @param {function(!WebInspector.Spectrum.Palette)} callback
 */
WebInspector.Spectrum.PaletteGenerator = function(callback)
{
    this._callback = callback;
    /** @type {!Map.<string, number>} */
    this._frequencyMap = new Map();
    var stylesheetPromises = [];
    for (var target of WebInspector.targetManager.targets(WebInspector.Target.Type.Page)) {
        var cssModel = WebInspector.CSSStyleModel.fromTarget(target);
        for (var stylesheet of cssModel.allStyleSheets())
            stylesheetPromises.push(new Promise(this._processStylesheet.bind(this, stylesheet)));
    }
    Promise.all(stylesheetPromises)
        .catchException(null)
        .then(this._finish.bind(this));
}

WebInspector.Spectrum.PaletteGenerator.prototype = {
    /**
     * @param {string} a
     * @param {string} b
     * @return {number}
     */
    _frequencyComparator: function(a, b)
    {
        return this._frequencyMap.get(b) - this._frequencyMap.get(a);
    },

    _finish: function()
    {
        /**
         * @param {string} a
         * @param {string} b
         * @return {number}
         */
        function hueComparator(a, b)
        {
            var hsva = paletteColors.get(a).hsva();
            var hsvb = paletteColors.get(b).hsva();

            // First trim the shades of gray
            if (hsvb[1] < 0.12 && hsva[1] < 0.12)
                return hsvb[2]*hsvb[3] - hsva[2]*hsva[3];
            if (hsvb[1] < 0.12)
                return -1;
            if (hsva[1] < 0.12)
                return 1;

            // Equal hue -> sort by sat
            if (hsvb[0] === hsva[0])
                return hsvb[1]*hsvb[3] - hsva[1]*hsva[3];

            return (hsvb[0] + 0.94) % 1 - (hsva[0] + 0.94) % 1;
        }

        var colors = this._frequencyMap.keysArray();
        colors = colors.sort(this._frequencyComparator.bind(this));
        /** @type {!Map.<string, !WebInspector.Color>} */
        var paletteColors = new Map();
        var colorsPerRow = 24;
        while (paletteColors.size < colorsPerRow && colors.length) {
            var colorText = colors.shift();
            var color = WebInspector.Color.parse(colorText);
            if (!color || color.nickname() === "white" || color.nickname() === "black")
                continue;
            paletteColors.set(colorText, color);
        }

        this._callback({ title: WebInspector.Spectrum.GeneratedPaletteTitle, colors: paletteColors.keysArray().sort(hueComparator), mutable: false });
    },

    /**
     * @param {!WebInspector.CSSStyleSheetHeader} stylesheet
     * @param {function(?)} resolve
     * @this {WebInspector.Spectrum.PaletteGenerator}
     */
    _processStylesheet: function(stylesheet, resolve)
    {
        /**
         * @param {?string} text
         * @this {WebInspector.Spectrum.PaletteGenerator}
         */
        function parseContent(text)
        {
            text = text.toLowerCase();
            var regexResult = text.match(/((?:rgb|hsl)a?\([^)]+\)|#[0-9a-f]{6}|#[0-9a-f]{3})/g) || [];
            for (var c of regexResult) {
                var frequency = this._frequencyMap.get(c) || 0;
                this._frequencyMap.set(c, ++frequency);
            }
            resolve(null);
        }

        stylesheet.requestContent().then(parseContent.bind(this));
    }
}

WebInspector.Spectrum.MaterialPaletteShades = {
    "#F44336": ["#FFEBEE", "#FFCDD2", "#EF9A9A", "#E57373", "#EF5350", "#F44336", "#E53935", "#D32F2F", "#C62828", "#B71C1C"],
    "#E91E63": ["#FCE4EC", "#F8BBD0", "#F48FB1", "#F06292", "#EC407A", "#E91E63", "#D81B60", "#C2185B", "#AD1457", "#880E4F"],
    "#9C27B0": ["#F3E5F5", "#E1BEE7", "#CE93D8", "#BA68C8", "#AB47BC", "#9C27B0", "#8E24AA", "#7B1FA2", "#6A1B9A", "#4A148C"],
    "#673AB7": ["#EDE7F6", "#D1C4E9", "#B39DDB", "#9575CD", "#7E57C2", "#673AB7", "#5E35B1", "#512DA8", "#4527A0", "#311B92"],
    "#3F51B5": ["#E8EAF6", "#C5CAE9", "#9FA8DA", "#7986CB", "#5C6BC0", "#3F51B5", "#3949AB", "#303F9F", "#283593", "#1A237E"],
    "#2196F3": ["#E3F2FD", "#BBDEFB", "#90CAF9", "#64B5F6", "#42A5F5", "#2196F3", "#1E88E5", "#1976D2", "#1565C0", "#0D47A1"],
    "#03A9F4": ["#E1F5FE", "#B3E5FC", "#81D4FA", "#4FC3F7", "#29B6F6", "#03A9F4", "#039BE5", "#0288D1", "#0277BD", "#01579B"],
    "#00BCD4": ["#E0F7FA", "#B2EBF2", "#80DEEA", "#4DD0E1", "#26C6DA", "#00BCD4", "#00ACC1", "#0097A7", "#00838F", "#006064"],
    "#009688": ["#E0F2F1", "#B2DFDB", "#80CBC4", "#4DB6AC", "#26A69A", "#009688", "#00897B", "#00796B", "#00695C", "#004D40"],
    "#4CAF50": ["#E8F5E9", "#C8E6C9", "#A5D6A7", "#81C784", "#66BB6A", "#4CAF50", "#43A047", "#388E3C", "#2E7D32", "#1B5E20"],
    "#8BC34A": ["#F1F8E9", "#DCEDC8", "#C5E1A5", "#AED581", "#9CCC65", "#8BC34A", "#7CB342", "#689F38", "#558B2F", "#33691E"],
    "#CDDC39": ["#F9FBE7", "#F0F4C3", "#E6EE9C", "#DCE775", "#D4E157", "#CDDC39", "#C0CA33", "#AFB42B", "#9E9D24", "#827717"],
    "#FFEB3B": ["#FFFDE7", "#FFF9C4", "#FFF59D", "#FFF176", "#FFEE58", "#FFEB3B", "#FDD835", "#FBC02D", "#F9A825", "#F57F17"],
    "#FFC107": ["#FFF8E1", "#FFECB3", "#FFE082", "#FFD54F", "#FFCA28", "#FFC107", "#FFB300", "#FFA000", "#FF8F00", "#FF6F00"],
    "#FF9800": ["#FFF3E0", "#FFE0B2", "#FFCC80", "#FFB74D", "#FFA726", "#FF9800", "#FB8C00", "#F57C00", "#EF6C00", "#E65100"],
    "#FF5722": ["#FBE9E7", "#FFCCBC", "#FFAB91", "#FF8A65", "#FF7043", "#FF5722", "#F4511E", "#E64A19", "#D84315", "#BF360C"],
    "#795548": ["#EFEBE9", "#D7CCC8", "#BCAAA4", "#A1887F", "#8D6E63", "#795548", "#6D4C41", "#5D4037", "#4E342E", "#3E2723"],
    "#9E9E9E": ["#FAFAFA", "#F5F5F5", "#EEEEEE", "#E0E0E0", "#BDBDBD", "#9E9E9E", "#757575", "#616161", "#424242", "#212121"],
    "#607D8B": ["#ECEFF1", "#CFD8DC", "#B0BEC5", "#90A4AE", "#78909C", "#607D8B", "#546E7A", "#455A64", "#37474F", "#263238"]
};

WebInspector.Spectrum.MaterialPalette = { title: "Material", mutable: false, matchUserFormat: true, colors: Object.keys(WebInspector.Spectrum.MaterialPaletteShades) };
;/* ElementsBreadcrumbs.js */
// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @constructor
 * @extends {WebInspector.HBox}
 */
WebInspector.ElementsBreadcrumbs = function()
{
    WebInspector.HBox.call(this, true);
    this.registerRequiredCSS("elements/breadcrumbs.css");

    this.crumbsElement = this.contentElement.createChild("div", "crumbs");
    this.crumbsElement.addEventListener("mousemove", this._mouseMovedInCrumbs.bind(this), false);
    this.crumbsElement.addEventListener("mouseleave", this._mouseMovedOutOfCrumbs.bind(this), false);
    this._nodeSymbol = Symbol("node");
}

/** @enum {string} */
WebInspector.ElementsBreadcrumbs.Events = {
    NodeSelected: "NodeSelected"
}

WebInspector.ElementsBreadcrumbs.prototype = {
    wasShown: function()
    {
        this.update();
    },

    /**
     * @param {!Array.<!WebInspector.DOMNode>} nodes
     */
    updateNodes: function(nodes)
    {
        if (!nodes.length)
            return;

        var crumbs = this.crumbsElement;
        for (var crumb = crumbs.firstChild; crumb; crumb = crumb.nextSibling) {
            if (nodes.indexOf(crumb[this._nodeSymbol]) !== -1) {
                this.update(true);
                return;
            }
        }
    },

    /**
     * @param {?WebInspector.DOMNode} node
     */
    setSelectedNode: function(node)
    {
        this._currentDOMNode = node;
        this.update();
    },

    _mouseMovedInCrumbs: function(event)
    {
        var nodeUnderMouse = event.target;
        var crumbElement = nodeUnderMouse.enclosingNodeOrSelfWithClass("crumb");
        var node = /** @type {?WebInspector.DOMNode} */ (crumbElement ? crumbElement[this._nodeSymbol] : null);
        if (node)
            node.highlight();
    },

    _mouseMovedOutOfCrumbs: function(event)
    {
        if (this._currentDOMNode)
            WebInspector.DOMModel.hideDOMNodeHighlight();
    },

    /**
     * @param {boolean=} force
     */
    update: function(force)
    {
        if (!this.isShowing())
            return;

        var currentDOMNode = this._currentDOMNode;
        var crumbs = this.crumbsElement;

        var handled = false;
        var crumb = crumbs.firstChild;
        while (crumb) {
            if (crumb[this._nodeSymbol] === currentDOMNode) {
                crumb.classList.add("selected");
                handled = true;
            } else {
                crumb.classList.remove("selected");
            }

            crumb = crumb.nextSibling;
        }

        if (handled && !force) {
            // We don't need to rebuild the crumbs, but we need to adjust sizes
            // to reflect the new focused or root node.
            this.updateSizes();
            return;
        }

        crumbs.removeChildren();

        var panel = this;

        /**
         * @param {!Event} event
         * @this {WebInspector.ElementsBreadcrumbs}
         */
        function selectCrumb(event)
        {
            event.preventDefault();
            var crumb = /** @type {!Element} */ (event.currentTarget);
            if (!crumb.classList.contains("collapsed")) {
                this.dispatchEventToListeners(WebInspector.ElementsBreadcrumbs.Events.NodeSelected, crumb[this._nodeSymbol]);
                return;
            }

            // Clicking a collapsed crumb will expose the hidden crumbs.
            if (crumb === panel.crumbsElement.firstChild) {
                // If the focused crumb is the first child, pick the farthest crumb
                // that is still hidden. This allows the user to expose every crumb.
                var currentCrumb = crumb;
                while (currentCrumb) {
                    var hidden = currentCrumb.classList.contains("hidden");
                    var collapsed = currentCrumb.classList.contains("collapsed");
                    if (!hidden && !collapsed)
                        break;
                    crumb = currentCrumb;
                    currentCrumb = currentCrumb.nextSiblingElement;
                }
            }

            this.updateSizes(crumb);
        }

        var boundSelectCrumb = selectCrumb.bind(this);
        for (var current = currentDOMNode; current; current = current.parentNode) {
            if (current.nodeType() === Node.DOCUMENT_NODE)
                continue;

            crumb = createElementWithClass("span", "crumb");
            crumb[this._nodeSymbol] = current;
            crumb.addEventListener("mousedown", boundSelectCrumb, false);

            var crumbTitle = "";
            switch (current.nodeType()) {
                case Node.ELEMENT_NODE:
                    if (current.pseudoType())
                        crumbTitle = "::" + current.pseudoType();
                    else
                        WebInspector.DOMPresentationUtils.decorateNodeLabel(current, crumb);
                    break;

                case Node.TEXT_NODE:
                    crumbTitle = WebInspector.UIString("(text)");
                    break;

                case Node.COMMENT_NODE:
                    crumbTitle = "<!-->";
                    break;

                case Node.DOCUMENT_TYPE_NODE:
                    crumbTitle = "<!DOCTYPE>";
                    break;

                case Node.DOCUMENT_FRAGMENT_NODE:
                    crumbTitle = current.shadowRootType() ? "#shadow-root" : current.nodeNameInCorrectCase();
                    break;

                default:
                    crumbTitle = current.nodeNameInCorrectCase();
            }

            if (!crumb.childNodes.length) {
                var nameElement = createElement("span");
                nameElement.textContent = crumbTitle;
                crumb.appendChild(nameElement);
                crumb.title = crumbTitle;
            }

            if (current === currentDOMNode)
                crumb.classList.add("selected");
            crumbs.insertBefore(crumb, crumbs.firstChild);
        }

        this.updateSizes();
    },

    /**
     * @param {!Element=} focusedCrumb
     */
    updateSizes: function(focusedCrumb)
    {
        if (!this.isShowing())
            return;

        var crumbs = this.crumbsElement;
        if (!crumbs.firstChild)
            return;

        var selectedIndex = 0;
        var focusedIndex = 0;
        var selectedCrumb;

        // Reset crumb styles.
        for (var i = 0; i < crumbs.childNodes.length; ++i) {
            var crumb = crumbs.childNodes[i];
            // Find the selected crumb and index.
            if (!selectedCrumb && crumb.classList.contains("selected")) {
                selectedCrumb = crumb;
                selectedIndex = i;
            }

            // Find the focused crumb index.
            if (crumb === focusedCrumb)
                focusedIndex = i;

            crumb.classList.remove("compact", "collapsed", "hidden");
        }

        // Layout 1: Measure total and normal crumb sizes
        var contentElementWidth = this.contentElement.offsetWidth;
        var normalSizes = [];
        for (var i = 0; i < crumbs.childNodes.length; ++i) {
            var crumb = crumbs.childNodes[i];
            normalSizes[i] = crumb.offsetWidth;
        }

        // Layout 2: Measure collapsed crumb sizes
        var compactSizes = [];
        for (var i = 0; i < crumbs.childNodes.length; ++i) {
            var crumb = crumbs.childNodes[i];
            crumb.classList.add("compact");
        }
        for (var i = 0; i < crumbs.childNodes.length; ++i) {
            var crumb = crumbs.childNodes[i];
            compactSizes[i] = crumb.offsetWidth;
        }

        // Layout 3: Measure collapsed crumb size
        crumbs.firstChild.classList.add("collapsed");
        var collapsedSize = crumbs.firstChild.offsetWidth;

        // Clean up.
        for (var i = 0; i < crumbs.childNodes.length; ++i) {
            var crumb = crumbs.childNodes[i];
            crumb.classList.remove("compact", "collapsed");
        }

        function crumbsAreSmallerThanContainer()
        {
            var totalSize = 0;
            for (var i = 0; i < crumbs.childNodes.length; ++i) {
                var crumb = crumbs.childNodes[i];
                if (crumb.classList.contains("hidden"))
                    continue;
                if (crumb.classList.contains("collapsed")) {
                    totalSize += collapsedSize;
                    continue;
                }
                totalSize += crumb.classList.contains("compact") ? compactSizes[i] : normalSizes[i];
            }
            const rightPadding = 10;
            return totalSize + rightPadding < contentElementWidth;
        }

        if (crumbsAreSmallerThanContainer())
            return; // No need to compact the crumbs, they all fit at full size.

        var BothSides = 0;
        var AncestorSide = -1;
        var ChildSide = 1;

        /**
         * @param {function(!Element)} shrinkingFunction
         * @param {number} direction
         */
        function makeCrumbsSmaller(shrinkingFunction, direction)
        {
            var significantCrumb = focusedCrumb || selectedCrumb;
            var significantIndex = significantCrumb === selectedCrumb ? selectedIndex : focusedIndex;

            function shrinkCrumbAtIndex(index)
            {
                var shrinkCrumb = crumbs.childNodes[index];
                if (shrinkCrumb && shrinkCrumb !== significantCrumb)
                    shrinkingFunction(shrinkCrumb);
                if (crumbsAreSmallerThanContainer())
                    return true; // No need to compact the crumbs more.
                return false;
            }

            // Shrink crumbs one at a time by applying the shrinkingFunction until the crumbs
            // fit in the container or we run out of crumbs to shrink.
            if (direction) {
                // Crumbs are shrunk on only one side (based on direction) of the signifcant crumb.
                var index = (direction > 0 ? 0 : crumbs.childNodes.length - 1);
                while (index !== significantIndex) {
                    if (shrinkCrumbAtIndex(index))
                        return true;
                    index += (direction > 0 ? 1 : -1);
                }
            } else {
                // Crumbs are shrunk in order of descending distance from the signifcant crumb,
                // with a tie going to child crumbs.
                var startIndex = 0;
                var endIndex = crumbs.childNodes.length - 1;
                while (startIndex != significantIndex || endIndex != significantIndex) {
                    var startDistance = significantIndex - startIndex;
                    var endDistance = endIndex - significantIndex;
                    if (startDistance >= endDistance)
                        var index = startIndex++;
                    else
                        var index = endIndex--;
                    if (shrinkCrumbAtIndex(index))
                        return true;
                }
            }

            // We are not small enough yet, return false so the caller knows.
            return false;
        }

        function coalesceCollapsedCrumbs()
        {
            var crumb = crumbs.firstChild;
            var collapsedRun = false;
            var newStartNeeded = false;
            var newEndNeeded = false;
            while (crumb) {
                var hidden = crumb.classList.contains("hidden");
                if (!hidden) {
                    var collapsed = crumb.classList.contains("collapsed");
                    if (collapsedRun && collapsed) {
                        crumb.classList.add("hidden");
                        crumb.classList.remove("compact");
                        crumb.classList.remove("collapsed");

                        if (crumb.classList.contains("start")) {
                            crumb.classList.remove("start");
                            newStartNeeded = true;
                        }

                        if (crumb.classList.contains("end")) {
                            crumb.classList.remove("end");
                            newEndNeeded = true;
                        }

                        continue;
                    }

                    collapsedRun = collapsed;

                    if (newEndNeeded) {
                        newEndNeeded = false;
                        crumb.classList.add("end");
                    }
                } else {
                    collapsedRun = true;
                }
                crumb = crumb.nextSibling;
            }

            if (newStartNeeded) {
                crumb = crumbs.lastChild;
                while (crumb) {
                    if (!crumb.classList.contains("hidden")) {
                        crumb.classList.add("start");
                        break;
                    }
                    crumb = crumb.previousSibling;
                }
            }
        }

        /**
         * @param {!Element} crumb
         */
        function compact(crumb)
        {
            if (crumb.classList.contains("hidden"))
                return;
            crumb.classList.add("compact");
        }

        /**
         * @param {!Element} crumb
         * @param {boolean=} dontCoalesce
         */
        function collapse(crumb, dontCoalesce)
        {
            if (crumb.classList.contains("hidden"))
                return;
            crumb.classList.add("collapsed");
            crumb.classList.remove("compact");
            if (!dontCoalesce)
                coalesceCollapsedCrumbs();
        }

        if (!focusedCrumb) {
            // When not focused on a crumb we can be biased and collapse less important
            // crumbs that the user might not care much about.

            // Compact child crumbs.
            if (makeCrumbsSmaller(compact, ChildSide))
                return;

            // Collapse child crumbs.
            if (makeCrumbsSmaller(collapse, ChildSide))
                return;
        }

        // Compact ancestor crumbs, or from both sides if focused.
        if (makeCrumbsSmaller(compact, focusedCrumb ? BothSides : AncestorSide))
            return;

        // Collapse ancestor crumbs, or from both sides if focused.
        if (makeCrumbsSmaller(collapse, focusedCrumb ? BothSides : AncestorSide))
            return;

        if (!selectedCrumb)
            return;

        // Compact the selected crumb.
        compact(selectedCrumb);
        if (crumbsAreSmallerThanContainer())
            return;

        // Collapse the selected crumb as a last resort. Pass true to prevent coalescing.
        collapse(selectedCrumb, true);
    },

    __proto__: WebInspector.HBox.prototype
}
;/* ElementsSidebarPane.js */
// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @constructor
 * @extends {WebInspector.SidebarPane}
 * @param {string} title
 */
WebInspector.ElementsSidebarPane = function(title)
{
    WebInspector.SidebarPane.call(this, title);
    this._node = null;
    this._updateController = new WebInspector.ElementsSidebarPane._UpdateController(this, this.doUpdate.bind(this));
    WebInspector.context.addFlavorChangeListener(WebInspector.DOMNode, this._nodeChanged, this);
}

WebInspector.ElementsSidebarPane.prototype = {
    /**
     * @return {?WebInspector.DOMNode}
     */
    node: function()
    {
        return this._node;
    },

    /**
     * @return {?WebInspector.CSSStyleModel}
     */
    cssModel: function()
    {
        return this._cssModel && this._cssModel.isEnabled() ? this._cssModel : null;
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _nodeChanged: function(event)
    {
        this.setNode(/** @type {?WebInspector.DOMNode} */ (event.data));
    },

    /**
     * @param {?WebInspector.DOMNode} node
     */
    setNode: function(node)
    {
        this._node = node;
        this._updateTarget(node ? node.target() : null);
        this.update();
    },

    /**
     * @protected
     * @return {!Promise.<?>}
     */
    doUpdate: function()
    {
        return Promise.resolve();
    },

    update: function()
    {
        this._updateController.update();
    },

    wasShown: function()
    {
        WebInspector.SidebarPane.prototype.wasShown.call(this);
        this._updateController.viewWasShown();
    },

    /**
     * @param {?WebInspector.Target} target
     */
    _updateTarget: function(target)
    {
        if (this._target === target)
            return;
        if (this._targetEvents) {
            WebInspector.EventTarget.removeEventListeners(this._targetEvents);
            this._targetEvents = null;
        }
        this._target = target;

        var domModel = null;
        var resourceTreeModel = null;
        if (target) {
            this._cssModel = WebInspector.CSSStyleModel.fromTarget(target);
            domModel = WebInspector.DOMModel.fromTarget(target);
            resourceTreeModel = target.resourceTreeModel;
        }

        if (this._cssModel && domModel && resourceTreeModel) {
            this._targetEvents = [
                this._cssModel.addEventListener(WebInspector.CSSStyleModel.Events.StyleSheetAdded, this.onCSSModelChanged, this),
                this._cssModel.addEventListener(WebInspector.CSSStyleModel.Events.StyleSheetRemoved, this.onCSSModelChanged, this),
                this._cssModel.addEventListener(WebInspector.CSSStyleModel.Events.StyleSheetChanged, this.onCSSModelChanged, this),
                this._cssModel.addEventListener(WebInspector.CSSStyleModel.Events.MediaQueryResultChanged, this.onCSSModelChanged, this),
                this._cssModel.addEventListener(WebInspector.CSSStyleModel.Events.PseudoStateForced, this.onCSSModelChanged, this),
                this._cssModel.addEventListener(WebInspector.CSSStyleModel.Events.ModelWasEnabled, this.onCSSModelChanged, this),
                domModel.addEventListener(WebInspector.DOMModel.Events.DOMMutated, this._domModelChanged, this),
                resourceTreeModel.addEventListener(WebInspector.ResourceTreeModel.EventTypes.FrameResized, this._onFrameResized, this),
            ];
        }
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _onFrameResized: function(event)
    {
        /**
         * @this {WebInspector.ElementsSidebarPane}
         */
        function refreshContents()
        {
            this.onFrameResizedThrottled();
            delete this._frameResizedTimer;
        }

        if (this._frameResizedTimer)
            clearTimeout(this._frameResizedTimer);

        this._frameResizedTimer = setTimeout(refreshContents.bind(this), 100);
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _domModelChanged: function(event)
    {
        var node = /** @type {!WebInspector.DOMNode} */ (event.data);
        this.onDOMModelChanged(node)
    },

    /**
     * @param {!WebInspector.DOMNode} node
     */
    onDOMModelChanged: function(node) { },

    onCSSModelChanged: function() { },

    onFrameResizedThrottled: function() { },

    __proto__: WebInspector.SidebarPane.prototype
}

/**
 * @constructor
 * @param {!WebInspector.Widget} view
 * @param {function():!Promise.<?>} doUpdate
 */
WebInspector.ElementsSidebarPane._UpdateController = function(view, doUpdate)
{
    this._view = view;
    this._updateThrottler = new WebInspector.Throttler(100);
    this._updateWhenVisible = false;
    this._doUpdate = doUpdate;
}

WebInspector.ElementsSidebarPane._UpdateController.prototype = {
    update: function()
    {
        this._updateWhenVisible = !this._view.isShowing();
        if (this._updateWhenVisible)
            return;
        this._updateThrottler.schedule(innerUpdate.bind(this));

        /**
         * @this {WebInspector.ElementsSidebarPane._UpdateController}
         * @return {!Promise.<?>}
         */
        function innerUpdate()
        {
            return this._view.isShowing() ? this._doUpdate.call(null) : Promise.resolve();
        }
    },

    viewWasShown: function()
    {
        if (this._updateWhenVisible)
            this.update();
    }
}
;/* ElementsSidebarView.js */
// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @constructor
 * @extends {WebInspector.SidebarPane}
 * @param {string} title
 * @param {!WebInspector.Widget} widget
 */
WebInspector.ElementsSidebarViewWrapperPane = function(title, widget)
{
    WebInspector.SidebarPane.call(this, title);
    widget.show(this.element);
}

WebInspector.ElementsSidebarViewWrapperPane.prototype = {
    __proto__: WebInspector.SidebarPane.prototype
}
;/* ElementsTreeElement.js */
/*
 * Copyright (C) 2007, 2008 Apple Inc.  All rights reserved.
 * Copyright (C) 2008 Matt Lilek <webkit@mattlilek.com>
 * Copyright (C) 2009 Joseph Pecoraro
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
 * @extends {TreeElement}
 * @param {!WebInspector.DOMNode} node
 * @param {boolean=} elementCloseTag
 */
WebInspector.ElementsTreeElement = function(node, elementCloseTag)
{
    // The title will be updated in onattach.
    TreeElement.call(this);
    this._node = node;

    this._gutterContainer = this.listItemElement.createChild("div", "gutter-container");
    this._gutterContainer.addEventListener("click", this._showContextMenu.bind(this));
    this._decorationsElement = this._gutterContainer.createChild("div", "hidden");

    this._elementCloseTag = elementCloseTag;

    if (this._node.nodeType() == Node.ELEMENT_NODE && !elementCloseTag)
        this._canAddAttributes = true;
    this._searchQuery = null;
    this._expandedChildrenLimit = WebInspector.ElementsTreeElement.InitialChildrenLimit;
}

WebInspector.ElementsTreeElement.InitialChildrenLimit = 500;

// A union of HTML4 and HTML5-Draft elements that explicitly
// or implicitly (for HTML5) forbid the closing tag.
WebInspector.ElementsTreeElement.ForbiddenClosingTagElements = [
    "area", "base", "basefont", "br", "canvas", "col", "command", "embed", "frame",
    "hr", "img", "input", "keygen", "link", "menuitem", "meta", "param", "source", "track", "wbr"
].keySet();

// These tags we do not allow editing their tag name.
WebInspector.ElementsTreeElement.EditTagBlacklist = [
    "html", "head", "body"
].keySet();

/**
 * @param {!WebInspector.ElementsTreeElement} treeElement
 */
WebInspector.ElementsTreeElement.animateOnDOMUpdate = function(treeElement)
{
    var tagName = treeElement.listItemElement.querySelector(".webkit-html-tag-name");
    WebInspector.runCSSAnimationOnce(tagName || treeElement.listItemElement, "dom-update-highlight");
}

/**
 * @param {!WebInspector.DOMNode} node
 * @return {!Array<!WebInspector.DOMNode>}
 */
WebInspector.ElementsTreeElement.visibleShadowRoots = function(node)
{
    var roots = node.shadowRoots();
    if (roots.length && !WebInspector.moduleSetting("showUAShadowDOM").get())
        roots = roots.filter(filter);

    /**
     * @param {!WebInspector.DOMNode} root
     */
    function filter(root)
    {
        return root.shadowRootType() !== WebInspector.DOMNode.ShadowRootTypes.UserAgent;
    }
    return roots;
}

/**
 * @param {!WebInspector.DOMNode} node
 * @return {boolean}
 */
WebInspector.ElementsTreeElement.canShowInlineText = function(node)
{
    if (node.importedDocument() || node.templateContent() || WebInspector.ElementsTreeElement.visibleShadowRoots(node).length || node.hasPseudoElements())
        return false;
    if (node.nodeType() !== Node.ELEMENT_NODE)
        return false;
    if (!node.firstChild || node.firstChild !== node.lastChild || node.firstChild.nodeType() !== Node.TEXT_NODE)
        return false;
    var textChild = node.firstChild;
    var maxInlineTextChildLength = 80;
    if (textChild.nodeValue().length < maxInlineTextChildLength)
        return true;
    return false;
}

/**
 * @param {!WebInspector.ContextSubMenuItem} subMenu
 * @param {!WebInspector.DOMNode} node
 */
WebInspector.ElementsTreeElement.populateForcedPseudoStateItems = function(subMenu, node)
{
    const pseudoClasses = ["active", "hover", "focus", "visited"];
    var forcedPseudoState = WebInspector.CSSStyleModel.fromNode(node).pseudoState(node);
    for (var i = 0; i < pseudoClasses.length; ++i) {
        var pseudoClassForced = forcedPseudoState.indexOf(pseudoClasses[i]) >= 0;
        subMenu.appendCheckboxItem(":" + pseudoClasses[i], setPseudoStateCallback.bind(null, pseudoClasses[i], !pseudoClassForced), pseudoClassForced, false);
    }

    /**
     * @param {string} pseudoState
     * @param {boolean} enabled
     */
    function setPseudoStateCallback(pseudoState, enabled)
    {
        WebInspector.CSSStyleModel.fromNode(node).forcePseudoState(node, pseudoState, enabled);
    }
}

WebInspector.ElementsTreeElement.prototype = {
    /**
     * @return {boolean}
     */
    isClosingTag: function()
    {
        return !!this._elementCloseTag;
    },

    /**
     * @return {!WebInspector.DOMNode}
     */
    node: function()
    {
        return this._node;
    },

    /**
     * @return {boolean}
     */
    isEditing: function()
    {
        return !!this._editing;
    },

    /**
     * @param {string} searchQuery
     */
    highlightSearchResults: function(searchQuery)
    {
        if (this._searchQuery !== searchQuery)
            this._hideSearchHighlight();

        this._searchQuery = searchQuery;
        this._searchHighlightsVisible = true;
        this.updateTitle(null, true);
    },

    hideSearchHighlights: function()
    {
        delete this._searchHighlightsVisible;
        this._hideSearchHighlight();
    },

    _hideSearchHighlight: function()
    {
        if (!this._highlightResult)
            return;

        function updateEntryHide(entry)
        {
            switch (entry.type) {
                case "added":
                    entry.node.remove();
                    break;
                case "changed":
                    entry.node.textContent = entry.oldText;
                    break;
            }
        }

        for (var i = (this._highlightResult.length - 1); i >= 0; --i)
            updateEntryHide(this._highlightResult[i]);

        delete this._highlightResult;
    },

    /**
     * @param {boolean} inClipboard
     */
    setInClipboard: function(inClipboard)
    {
        if (this._inClipboard === inClipboard)
            return;
        this._inClipboard = inClipboard;
        this.listItemElement.classList.toggle("in-clipboard", inClipboard);
    },

    get hovered()
    {
        return this._hovered;
    },

    set hovered(x)
    {
        if (this._hovered === x)
            return;

        this._hovered = x;

        if (this.listItemElement) {
            if (x) {
                this.updateSelection();
                this.listItemElement.classList.add("hovered");
            } else {
                this.listItemElement.classList.remove("hovered");
            }
        }
    },

    /**
     * @return {number}
     */
    expandedChildrenLimit: function()
    {
        return this._expandedChildrenLimit;
    },

    /**
     * @param {number} expandedChildrenLimit
     */
    setExpandedChildrenLimit: function(expandedChildrenLimit)
    {
        this._expandedChildrenLimit = expandedChildrenLimit;
    },

    updateSelection: function()
    {
        var listItemElement = this.listItemElement;
        if (!listItemElement)
            return;

        if (!this.selectionElement) {
            this.selectionElement = createElement("div");
            this.selectionElement.className = "selection fill";
            listItemElement.insertBefore(this.selectionElement, listItemElement.firstChild);
        }
    },

    /**
     * @override
     */
    onbind: function()
    {
        if (!this._elementCloseTag)
            this._node[this.treeOutline.treeElementSymbol()] = this;
    },

    /**
     * @override
     */
    onunbind: function()
    {
        if (this._node[this.treeOutline.treeElementSymbol()] === this)
            this._node[this.treeOutline.treeElementSymbol()] = null;
    },

    /**
     * @override
     */
    onattach: function()
    {
        if (this._hovered) {
            this.updateSelection();
            this.listItemElement.classList.add("hovered");
        }

        this.updateTitle();
        this._preventFollowingLinksOnDoubleClick();
        this.listItemElement.draggable = true;
    },

    _preventFollowingLinksOnDoubleClick: function()
    {
        var links = this.listItemElement.querySelectorAll("li .webkit-html-tag > .webkit-html-attribute > .webkit-html-external-link, li .webkit-html-tag > .webkit-html-attribute > .webkit-html-resource-link");
        if (!links)
            return;

        for (var i = 0; i < links.length; ++i)
            links[i].preventFollowOnDoubleClick = true;
    },

    onpopulate: function()
    {
        this.populated = true;
        this.treeOutline.populateTreeElement(this);
    },

    expandRecursively: function()
    {
        /**
         * @this {WebInspector.ElementsTreeElement}
         */
        function callback()
        {
            TreeElement.prototype.expandRecursively.call(this, Number.MAX_VALUE);
        }

        this._node.getSubtree(-1, callback.bind(this));
    },

    /**
     * @override
     */
    onexpand: function()
    {
        if (this._elementCloseTag)
            return;

        this.updateTitle();
        this.treeOutline.updateSelection();
    },

    oncollapse: function()
    {
        if (this._elementCloseTag)
            return;

        this.updateTitle();
        this.treeOutline.updateSelection();
    },

    /**
     * @override
     * @param {boolean=} omitFocus
     * @param {boolean=} selectedByUser
     * @return {boolean}
     */
    select: function(omitFocus, selectedByUser)
    {
        if (this._editing)
            return false;
        return TreeElement.prototype.select.call(this, omitFocus, selectedByUser);
    },

    /**
     * @override
     * @param {boolean=} selectedByUser
     * @return {boolean}
     */
    onselect: function(selectedByUser)
    {
        this.treeOutline.suppressRevealAndSelect = true;
        this.treeOutline.selectDOMNode(this._node, selectedByUser);
        if (selectedByUser)
            this._node.highlight();
        this.updateSelection();
        this.treeOutline.suppressRevealAndSelect = false;
        return true;
    },

    /**
     * @override
     * @return {boolean}
     */
    ondelete: function()
    {
        var startTagTreeElement = this.treeOutline.findTreeElement(this._node);
        startTagTreeElement ? startTagTreeElement.remove() : this.remove();
        return true;
    },

    /**
     * @override
     * @return {boolean}
     */
    onenter: function()
    {
        // On Enter or Return start editing the first attribute
        // or create a new attribute on the selected element.
        if (this._editing)
            return false;

        this._startEditing();

        // prevent a newline from being immediately inserted
        return true;
    },

    selectOnMouseDown: function(event)
    {
        TreeElement.prototype.selectOnMouseDown.call(this, event);

        if (this._editing)
            return;

        // Prevent selecting the nearest word on double click.
        if (event.detail >= 2)
            event.preventDefault();
    },

    /**
     * @override
     * @return {boolean}
     */
    ondblclick: function(event)
    {
        if (this._editing || this._elementCloseTag)
            return false;

        if (this._startEditingTarget(/** @type {!Element} */(event.target)))
            return false;

        if (this.isExpandable() && !this.expanded)
            this.expand();
        return false;
    },

    /**
     * @return {boolean}
     */
    hasEditableNode: function()
    {
        return !this._node.isShadowRoot() && !this._node.ancestorUserAgentShadowRoot();
    },

    _insertInLastAttributePosition: function(tag, node)
    {
        if (tag.getElementsByClassName("webkit-html-attribute").length > 0)
            tag.insertBefore(node, tag.lastChild);
        else {
            var nodeName = tag.textContent.match(/^<(.*?)>$/)[1];
            tag.textContent = '';
            tag.createTextChild('<' + nodeName);
            tag.appendChild(node);
            tag.createTextChild('>');
        }

        this.updateSelection();
    },

    /**
     * @param {!Element} eventTarget
     * @return {boolean}
     */
    _startEditingTarget: function(eventTarget)
    {
        if (this.treeOutline.selectedDOMNode() != this._node)
            return false;

        if (this._node.nodeType() != Node.ELEMENT_NODE && this._node.nodeType() != Node.TEXT_NODE)
            return false;

        var textNode = eventTarget.enclosingNodeOrSelfWithClass("webkit-html-text-node");
        if (textNode)
            return this._startEditingTextNode(textNode);

        var attribute = eventTarget.enclosingNodeOrSelfWithClass("webkit-html-attribute");
        if (attribute)
            return this._startEditingAttribute(attribute, eventTarget);

        var tagName = eventTarget.enclosingNodeOrSelfWithClass("webkit-html-tag-name");
        if (tagName)
            return this._startEditingTagName(tagName);

        var newAttribute = eventTarget.enclosingNodeOrSelfWithClass("add-attribute");
        if (newAttribute)
            return this._addNewAttribute();

        return false;
    },

    /**
     * @param {!Event} event
     */
    _showContextMenu: function(event)
    {
        this.treeOutline.showContextMenu(this, event);
    },

    /**
     * @param {!WebInspector.ContextMenu} contextMenu
     * @param {!Event} event
     */
    populateTagContextMenu: function(contextMenu, event)
    {
        // Add attribute-related actions.
        var treeElement = this._elementCloseTag ? this.treeOutline.findTreeElement(this._node) : this;
        contextMenu.appendItem(WebInspector.UIString.capitalize("Add ^attribute"), treeElement._addNewAttribute.bind(treeElement));

        var attribute = event.target.enclosingNodeOrSelfWithClass("webkit-html-attribute");
        var newAttribute = event.target.enclosingNodeOrSelfWithClass("add-attribute");
        if (attribute && !newAttribute)
            contextMenu.appendItem(WebInspector.UIString.capitalize("Edit ^attribute"), this._startEditingAttribute.bind(this, attribute, event.target));
        this.populateNodeContextMenu(contextMenu);
        WebInspector.ElementsTreeElement.populateForcedPseudoStateItems(contextMenu, treeElement.node());
        contextMenu.appendSeparator();
        this.populateScrollIntoView(contextMenu);
    },

    /**
     * @param {!WebInspector.ContextMenu} contextMenu
     */
    populateScrollIntoView: function(contextMenu)
    {
        contextMenu.appendItem(WebInspector.UIString.capitalize("Scroll into ^view"), this._scrollIntoView.bind(this));
    },

    populateTextContextMenu: function(contextMenu, textNode)
    {
        if (!this._editing)
            contextMenu.appendItem(WebInspector.UIString.capitalize("Edit ^text"), this._startEditingTextNode.bind(this, textNode));
        this.populateNodeContextMenu(contextMenu);
    },

    populateNodeContextMenu: function(contextMenu)
    {
        // Add free-form node-related actions.
        var openTagElement = this._node[this.treeOutline.treeElementSymbol()] || this;
        var isEditable = this.hasEditableNode();
        if (isEditable && !this._editing)
            contextMenu.appendAction("elements.edit-as-html", WebInspector.UIString("Edit as HTML"));
        var isShadowRoot = this._node.isShadowRoot();

        // Place it here so that all "Copy"-ing items stick together.
        var copyMenu = contextMenu.appendSubMenuItem(WebInspector.UIString("Copy"));
        var createShortcut = WebInspector.KeyboardShortcut.shortcutToString;
        var modifier = WebInspector.KeyboardShortcut.Modifiers.CtrlOrMeta;
        var menuItem;
        if (!isShadowRoot)
            menuItem = copyMenu.appendItem(WebInspector.UIString("Copy outerHTML"), this.treeOutline.performCopyOrCut.bind(this.treeOutline, false, this._node));
            menuItem.setShortcut(createShortcut("V", modifier));
        if (this._node.nodeType() === Node.ELEMENT_NODE)
            copyMenu.appendItem(WebInspector.UIString.capitalize("Copy selector"), this._copyCSSPath.bind(this));
        if (!isShadowRoot)
            copyMenu.appendItem(WebInspector.UIString("Copy XPath"), this._copyXPath.bind(this));
        if (!isShadowRoot) {
            var treeOutline = this.treeOutline;
            menuItem = copyMenu.appendItem(WebInspector.UIString("Cut element"), treeOutline.performCopyOrCut.bind(treeOutline, true, this._node), !this.hasEditableNode());
            menuItem.setShortcut(createShortcut("X", modifier));
            menuItem = copyMenu.appendItem(WebInspector.UIString("Copy element"), treeOutline.performCopyOrCut.bind(treeOutline, false, this._node));
            menuItem.setShortcut(createShortcut("C", modifier));
            menuItem = copyMenu.appendItem(WebInspector.UIString("Paste element"), treeOutline.pasteNode.bind(treeOutline, this._node), !treeOutline.canPaste(this._node));
            menuItem.setShortcut(createShortcut("V", modifier));
        }

        contextMenu.appendSeparator();
        menuItem = contextMenu.appendCheckboxItem(WebInspector.UIString("Hide element"), this.treeOutline.toggleHideElement.bind(this.treeOutline, this._node), this.treeOutline.isToggledToHidden(this._node));
        menuItem.setShortcut(WebInspector.shortcutRegistry.shortcutTitleForAction("elements.hide-element"));


        if (isEditable)
            contextMenu.appendItem(WebInspector.UIString("Delete element"), this.remove.bind(this));
        contextMenu.appendSeparator();
    },

    _startEditing: function()
    {
        if (this.treeOutline.selectedDOMNode() !== this._node)
            return;

        var listItem = this._listItemNode;

        if (this._canAddAttributes) {
            var attribute = listItem.getElementsByClassName("webkit-html-attribute")[0];
            if (attribute)
                return this._startEditingAttribute(attribute, attribute.getElementsByClassName("webkit-html-attribute-value")[0]);

            return this._addNewAttribute();
        }

        if (this._node.nodeType() === Node.TEXT_NODE) {
            var textNode = listItem.getElementsByClassName("webkit-html-text-node")[0];
            if (textNode)
                return this._startEditingTextNode(textNode);
            return;
        }
    },

    _addNewAttribute: function()
    {
        // Cannot just convert the textual html into an element without
        // a parent node. Use a temporary span container for the HTML.
        var container = createElement("span");
        this._buildAttributeDOM(container, " ", "", null);
        var attr = container.firstElementChild;
        attr.style.marginLeft = "2px"; // overrides the .editing margin rule
        attr.style.marginRight = "2px"; // overrides the .editing margin rule

        var tag = this.listItemElement.getElementsByClassName("webkit-html-tag")[0];
        this._insertInLastAttributePosition(tag, attr);
        attr.scrollIntoViewIfNeeded(true);
        return this._startEditingAttribute(attr, attr);
    },

    _triggerEditAttribute: function(attributeName)
    {
        var attributeElements = this.listItemElement.getElementsByClassName("webkit-html-attribute-name");
        for (var i = 0, len = attributeElements.length; i < len; ++i) {
            if (attributeElements[i].textContent === attributeName) {
                for (var elem = attributeElements[i].nextSibling; elem; elem = elem.nextSibling) {
                    if (elem.nodeType !== Node.ELEMENT_NODE)
                        continue;

                    if (elem.classList.contains("webkit-html-attribute-value"))
                        return this._startEditingAttribute(elem.parentNode, elem);
                }
            }
        }
    },

    _startEditingAttribute: function(attribute, elementForSelection)
    {
        console.assert(this.listItemElement.isAncestor(attribute));

        if (WebInspector.isBeingEdited(attribute))
            return true;

        var attributeNameElement = attribute.getElementsByClassName("webkit-html-attribute-name")[0];
        if (!attributeNameElement)
            return false;

        var attributeName = attributeNameElement.textContent;
        var attributeValueElement = attribute.getElementsByClassName("webkit-html-attribute-value")[0];

        // Make sure elementForSelection is not a child of attributeValueElement.
        elementForSelection = attributeValueElement.isAncestor(elementForSelection) ? attributeValueElement : elementForSelection;

        function removeZeroWidthSpaceRecursive(node)
        {
            if (node.nodeType === Node.TEXT_NODE) {
                node.nodeValue = node.nodeValue.replace(/\u200B/g, "");
                return;
            }

            if (node.nodeType !== Node.ELEMENT_NODE)
                return;

            for (var child = node.firstChild; child; child = child.nextSibling)
                removeZeroWidthSpaceRecursive(child);
        }

        var attributeValue = attributeName && attributeValueElement ? this._node.getAttribute(attributeName) : undefined;
        if (attributeValue !== undefined)
            attributeValueElement.setTextContentTruncatedIfNeeded(attributeValue, WebInspector.UIString("<value is too large to edit>"));

        // Remove zero-width spaces that were added by nodeTitleInfo.
        removeZeroWidthSpaceRecursive(attribute);

        var config = new WebInspector.InplaceEditor.Config(this._attributeEditingCommitted.bind(this), this._editingCancelled.bind(this), attributeName);

        /**
         * @param {!Event} event
         * @return {string}
         */
        function postKeyDownFinishHandler(event)
        {
            WebInspector.handleElementValueModifications(event, attribute);
            return "";
        }
        config.setPostKeydownFinishHandler(postKeyDownFinishHandler);

        this._editing = WebInspector.InplaceEditor.startEditing(attribute, config);

        this.listItemElement.getComponentSelection().setBaseAndExtent(elementForSelection, 0, elementForSelection, 1);

        return true;
    },

    /**
     * @param {!Element} textNodeElement
     */
    _startEditingTextNode: function(textNodeElement)
    {
        if (WebInspector.isBeingEdited(textNodeElement))
            return true;

        var textNode = this._node;
        // We only show text nodes inline in elements if the element only
        // has a single child, and that child is a text node.
        if (textNode.nodeType() === Node.ELEMENT_NODE && textNode.firstChild)
            textNode = textNode.firstChild;

        var container = textNodeElement.enclosingNodeOrSelfWithClass("webkit-html-text-node");
        if (container)
            container.textContent = textNode.nodeValue(); // Strip the CSS or JS highlighting if present.
        var config = new WebInspector.InplaceEditor.Config(this._textNodeEditingCommitted.bind(this, textNode), this._editingCancelled.bind(this));
        this._editing = WebInspector.InplaceEditor.startEditing(textNodeElement, config);
        this.listItemElement.getComponentSelection().setBaseAndExtent(textNodeElement, 0, textNodeElement, 1);

        return true;
    },

    /**
     * @param {!Element=} tagNameElement
     */
    _startEditingTagName: function(tagNameElement)
    {
        if (!tagNameElement) {
            tagNameElement = this.listItemElement.getElementsByClassName("webkit-html-tag-name")[0];
            if (!tagNameElement)
                return false;
        }

        var tagName = tagNameElement.textContent;
        if (WebInspector.ElementsTreeElement.EditTagBlacklist[tagName.toLowerCase()])
            return false;

        if (WebInspector.isBeingEdited(tagNameElement))
            return true;

        var closingTagElement = this._distinctClosingTagElement();

        /**
         * @param {!Event} event
         */
        function keyupListener(event)
        {
            if (closingTagElement)
                closingTagElement.textContent = "</" + tagNameElement.textContent + ">";
        }

        /**
         * @param {!Element} element
         * @param {string} newTagName
         * @this {WebInspector.ElementsTreeElement}
         */
        function editingComitted(element, newTagName)
        {
            tagNameElement.removeEventListener('keyup', keyupListener, false);
            this._tagNameEditingCommitted.apply(this, arguments);
        }

        /**
         * @this {WebInspector.ElementsTreeElement}
         */
        function editingCancelled()
        {
            tagNameElement.removeEventListener('keyup', keyupListener, false);
            this._editingCancelled.apply(this, arguments);
        }

        tagNameElement.addEventListener('keyup', keyupListener, false);

        var config = new WebInspector.InplaceEditor.Config(editingComitted.bind(this), editingCancelled.bind(this), tagName);
        this._editing = WebInspector.InplaceEditor.startEditing(tagNameElement, config);
        this.listItemElement.getComponentSelection().setBaseAndExtent(tagNameElement, 0, tagNameElement, 1);
        return true;
    },

    /**
     * @param {function(string, string)} commitCallback
     * @param {function()} disposeCallback
     * @param {?Protocol.Error} error
     * @param {string} initialValue
     */
    _startEditingAsHTML: function(commitCallback, disposeCallback, error, initialValue)
    {
        if (error)
            return;
        if (this._editing)
            return;

        function consume(event)
        {
            if (event.eventPhase === Event.AT_TARGET)
                event.consume(true);
        }

        initialValue = this._convertWhitespaceToEntities(initialValue).text;

        this._htmlEditElement = createElement("div");
        this._htmlEditElement.className = "source-code elements-tree-editor";

        // Hide header items.
        var child = this.listItemElement.firstChild;
        while (child) {
            child.style.display = "none";
            child = child.nextSibling;
        }
        // Hide children item.
        if (this._childrenListNode)
            this._childrenListNode.style.display = "none";
        // Append editor.
        this.listItemElement.appendChild(this._htmlEditElement);
        this.treeOutline.element.addEventListener("mousedown", consume, false);

        this.updateSelection();

        /**
         * @param {!Element} element
         * @param {string} newValue
         * @this {WebInspector.ElementsTreeElement}
         */
        function commit(element, newValue)
        {
            commitCallback(initialValue, newValue);
            dispose.call(this);
        }

        /**
         * @this {WebInspector.ElementsTreeElement}
         */
        function dispose()
        {
            disposeCallback();
            delete this._editing;
            this.treeOutline.setMultilineEditing(null);

            // Remove editor.
            this.listItemElement.removeChild(this._htmlEditElement);
            delete this._htmlEditElement;
            // Unhide children item.
            if (this._childrenListNode)
                this._childrenListNode.style.removeProperty("display");
            // Unhide header items.
            var child = this.listItemElement.firstChild;
            while (child) {
                child.style.removeProperty("display");
                child = child.nextSibling;
            }

            this.treeOutline.element.removeEventListener("mousedown", consume, false);
            this.updateSelection();
            this.treeOutline.focus();
        }

        var config = new WebInspector.InplaceEditor.Config(commit.bind(this), dispose.bind(this));
        config.setMultilineOptions(initialValue, { name: "xml", htmlMode: true }, "web-inspector-html", WebInspector.moduleSetting("domWordWrap").get(), true);
        WebInspector.InplaceEditor.startMultilineEditing(this._htmlEditElement, config).then(markAsBeingEdited.bind(this));

        /**
         * @param {!Object} controller
         * @this {WebInspector.ElementsTreeElement}
         */
        function markAsBeingEdited(controller)
        {
            this._editing = /** @type {!WebInspector.InplaceEditor.Controller} */ (controller);
            this._editing.setWidth(this.treeOutline.visibleWidth());
            this.treeOutline.setMultilineEditing(this._editing);
        }
    },

    _attributeEditingCommitted: function(element, newText, oldText, attributeName, moveDirection)
    {
        delete this._editing;

        var treeOutline = this.treeOutline;

        /**
         * @param {?Protocol.Error=} error
         * @this {WebInspector.ElementsTreeElement}
         */
        function moveToNextAttributeIfNeeded(error)
        {
            if (error)
                this._editingCancelled(element, attributeName);

            if (!moveDirection)
                return;

            treeOutline.runPendingUpdates();

            // Search for the attribute's position, and then decide where to move to.
            var attributes = this._node.attributes();
            for (var i = 0; i < attributes.length; ++i) {
                if (attributes[i].name !== attributeName)
                    continue;

                if (moveDirection === "backward") {
                    if (i === 0)
                        this._startEditingTagName();
                    else
                        this._triggerEditAttribute(attributes[i - 1].name);
                } else {
                    if (i === attributes.length - 1)
                        this._addNewAttribute();
                    else
                        this._triggerEditAttribute(attributes[i + 1].name);
                }
                return;
            }

            // Moving From the "New Attribute" position.
            if (moveDirection === "backward") {
                if (newText === " ") {
                    // Moving from "New Attribute" that was not edited
                    if (attributes.length > 0)
                        this._triggerEditAttribute(attributes[attributes.length - 1].name);
                } else {
                    // Moving from "New Attribute" that holds new value
                    if (attributes.length > 1)
                        this._triggerEditAttribute(attributes[attributes.length - 2].name);
                }
            } else if (moveDirection === "forward") {
                if (!newText.isWhitespace())
                    this._addNewAttribute();
                else
                    this._startEditingTagName();
            }
        }


        if ((attributeName.trim() || newText.trim()) && oldText !== newText) {
            this._node.setAttribute(attributeName, newText, moveToNextAttributeIfNeeded.bind(this));
            return;
        }

        this.updateTitle();
        moveToNextAttributeIfNeeded.call(this);
    },

    _tagNameEditingCommitted: function(element, newText, oldText, tagName, moveDirection)
    {
        delete this._editing;
        var self = this;

        function cancel()
        {
            var closingTagElement = self._distinctClosingTagElement();
            if (closingTagElement)
                closingTagElement.textContent = "</" + tagName + ">";

            self._editingCancelled(element, tagName);
            moveToNextAttributeIfNeeded.call(self);
        }

        /**
         * @this {WebInspector.ElementsTreeElement}
         */
        function moveToNextAttributeIfNeeded()
        {
            if (moveDirection !== "forward") {
                this._addNewAttribute();
                return;
            }

            var attributes = this._node.attributes();
            if (attributes.length > 0)
                this._triggerEditAttribute(attributes[0].name);
            else
                this._addNewAttribute();
        }

        newText = newText.trim();
        if (newText === oldText) {
            cancel();
            return;
        }

        var treeOutline = this.treeOutline;
        var wasExpanded = this.expanded;

        function changeTagNameCallback(error, nodeId)
        {
            if (error || !nodeId) {
                cancel();
                return;
            }
            var newTreeItem = treeOutline.selectNodeAfterEdit(wasExpanded, error, nodeId);
            moveToNextAttributeIfNeeded.call(newTreeItem);
        }
        this._node.setNodeName(newText, changeTagNameCallback);
    },

    /**
     * @param {!WebInspector.DOMNode} textNode
     * @param {!Element} element
     * @param {string} newText
     */
    _textNodeEditingCommitted: function(textNode, element, newText)
    {
        delete this._editing;

        /**
         * @this {WebInspector.ElementsTreeElement}
         */
        function callback()
        {
            this.updateTitle();
        }
        textNode.setNodeValue(newText, callback.bind(this));
    },

    /**
     * @param {!Element} element
     * @param {*} context
     */
    _editingCancelled: function(element, context)
    {
        delete this._editing;

        // Need to restore attributes structure.
        this.updateTitle();
    },

    /**
     * @return {!Element}
     */
    _distinctClosingTagElement: function()
    {
        // FIXME: Improve the Tree Element / Outline Abstraction to prevent crawling the DOM

        // For an expanded element, it will be the last element with class "close"
        // in the child element list.
        if (this.expanded) {
            var closers = this._childrenListNode.querySelectorAll(".close");
            return closers[closers.length-1];
        }

        // Remaining cases are single line non-expanded elements with a closing
        // tag, or HTML elements without a closing tag (such as <br>). Return
        // null in the case where there isn't a closing tag.
        var tags = this.listItemElement.getElementsByClassName("webkit-html-tag");
        return (tags.length === 1 ? null : tags[tags.length-1]);
    },

    /**
     * @param {?WebInspector.ElementsTreeOutline.UpdateRecord=} updateRecord
     * @param {boolean=} onlySearchQueryChanged
     */
    updateTitle: function(updateRecord, onlySearchQueryChanged)
    {
        // If we are editing, return early to prevent canceling the edit.
        // After editing is committed updateTitle will be called.
        if (this._editing)
            return;

        if (onlySearchQueryChanged) {
            this._hideSearchHighlight();
        } else {
            var nodeInfo = this._nodeTitleInfo(updateRecord || null);
            if (this._node.nodeType() === Node.DOCUMENT_FRAGMENT_NODE && this._node.isInShadowTree() && this._node.shadowRootType()) {
                this.childrenListElement.classList.add("shadow-root");
                var depth = 4;
                for (var node = this._node; depth && node; node = node.parentNode) {
                    if (node.nodeType() === Node.DOCUMENT_FRAGMENT_NODE)
                        depth--;
                }
                if (!depth)
                    this.childrenListElement.classList.add("shadow-root-deep");
                else
                    this.childrenListElement.classList.add("shadow-root-depth-" + depth);
            }
            var highlightElement = createElement("span");
            highlightElement.className = "highlight";
            highlightElement.appendChild(nodeInfo);
            this.title = highlightElement;
            this.updateDecorations();
            this.listItemElement.insertBefore(this._gutterContainer, this.listItemElement.firstChild);
            delete this._highlightResult;
        }

        delete this.selectionElement;
        if (this.selected)
            this.updateSelection();
        this._preventFollowingLinksOnDoubleClick();
        this._highlightSearchResults();
    },

    updateDecorations: function()
    {
        var treeElement = this.parent;
        var depth = 0;
        while (treeElement != null) {
            depth++;
            treeElement = treeElement.parent;
        }

        /** Keep it in sync with elementsTreeOutline.css **/
        this._gutterContainer.style.left = (-12 * (depth - 2) - (this.isExpandable() ? 1 : 12)) + "px";

        if (this.isClosingTag())
            return;

        var node = this._node;
        if (node.nodeType() !== Node.ELEMENT_NODE)
            return;

        if (!this.treeOutline._decoratorExtensions)
            /** @type {!Array.<!Runtime.Extension>} */
            this.treeOutline._decoratorExtensions = runtime.extensions(WebInspector.DOMPresentationUtils.MarkerDecorator);

        var markerToExtension = new Map();
        for (var i = 0; i < this.treeOutline._decoratorExtensions.length; ++i)
            markerToExtension.set(this.treeOutline._decoratorExtensions[i].descriptor()["marker"], this.treeOutline._decoratorExtensions[i]);

        var promises = [];
        var decorations = [];
        var descendantDecorations = [];
        node.traverseMarkers(visitor);

        /**
         * @param {!WebInspector.DOMNode} n
         * @param {string} marker
         */
        function visitor(n, marker)
        {
            var extension = markerToExtension.get(marker);
            if (!extension)
                return;
            promises.push(extension.instancePromise().then(collectDecoration.bind(null, n)));
        }

        /**
         * @param {!WebInspector.DOMNode} n
         * @param {!WebInspector.DOMPresentationUtils.MarkerDecorator} decorator
         */
        function collectDecoration(n, decorator)
        {
            var decoration = decorator.decorate(n);
            if (!decoration)
                return;
            (n === node ? decorations : descendantDecorations).push(decoration);
        }

        Promise.all(promises).then(updateDecorationsUI.bind(this));

        /**
         * @this {WebInspector.ElementsTreeElement}
         */
        function updateDecorationsUI()
        {
            this._decorationsElement.removeChildren();
            this._decorationsElement.classList.add("hidden");
            this._gutterContainer.classList.toggle("has-decorations", decorations.length || descendantDecorations.length);

            if (!decorations.length && !descendantDecorations.length)
                return;

            var colors = new Set();
            var titles = createElement("div");

            for (var decoration of decorations) {
                var titleElement = titles.createChild("div");
                titleElement.textContent = decoration.title;
                colors.add(decoration.color);
            }
            if (this.expanded && !decorations.length)
                return;

            var descendantColors = new Set();
            if (descendantDecorations.length) {
                var element = titles.createChild("div");
                element.textContent = WebInspector.UIString("Children:");
                for (var decoration of descendantDecorations) {
                    element = titles.createChild("div");
                    element.style.marginLeft = "15px";
                    element.textContent = decoration.title;
                    descendantColors.add(decoration.color);
                }
            }

            var offset = 0;
            processColors.call(this, colors, "elements-gutter-decoration");
            if (!this.expanded)
                processColors.call(this, descendantColors, "elements-gutter-decoration elements-has-decorated-children");
            WebInspector.Tooltip.install(this._decorationsElement, titles);

            /**
             * @param {!Set<string>} colors
             * @param {string} className
             * @this {WebInspector.ElementsTreeElement}
             */
            function processColors(colors, className)
            {
                for (var color of colors) {
                    var child = this._decorationsElement.createChild("div", className);
                    this._decorationsElement.classList.remove("hidden");
                    child.style.backgroundColor = color;
                    child.style.borderColor = color;
                    if (offset)
                        child.style.marginLeft = offset + "px";
                    offset += 3;
                }
            }
        }
    },

    /**
     * @param {!Node} parentElement
     * @param {string} name
     * @param {string} value
     * @param {?WebInspector.ElementsTreeOutline.UpdateRecord} updateRecord
     * @param {boolean=} forceValue
     * @param {!WebInspector.DOMNode=} node
     */
    _buildAttributeDOM: function(parentElement, name, value, updateRecord, forceValue, node)
    {
        var closingPunctuationRegex = /[\/;:\)\]\}]/g;
        var highlightIndex = 0;
        var highlightCount;
        var additionalHighlightOffset = 0;
        var result;

        /**
         * @param {string} match
         * @param {number} replaceOffset
         * @return {string}
         */
        function replacer(match, replaceOffset) {
            while (highlightIndex < highlightCount && result.entityRanges[highlightIndex].offset < replaceOffset) {
                result.entityRanges[highlightIndex].offset += additionalHighlightOffset;
                ++highlightIndex;
            }
            additionalHighlightOffset += 1;
            return match + "\u200B";
        }

        /**
         * @param {!Element} element
         * @param {string} value
         * @this {WebInspector.ElementsTreeElement}
         */
        function setValueWithEntities(element, value)
        {
            result = this._convertWhitespaceToEntities(value);
            highlightCount = result.entityRanges.length;
            value = result.text.replace(closingPunctuationRegex, replacer);
            while (highlightIndex < highlightCount) {
                result.entityRanges[highlightIndex].offset += additionalHighlightOffset;
                ++highlightIndex;
            }
            element.setTextContentTruncatedIfNeeded(value);
            WebInspector.highlightRangesWithStyleClass(element, result.entityRanges, "webkit-html-entity-value");
        }

        var hasText = (forceValue || value.length > 0);
        var attrSpanElement = parentElement.createChild("span", "webkit-html-attribute");
        var attrNameElement = attrSpanElement.createChild("span", "webkit-html-attribute-name");
        attrNameElement.textContent = name;

        if (hasText)
            attrSpanElement.createTextChild("=\u200B\"");

        var attrValueElement = attrSpanElement.createChild("span", "webkit-html-attribute-value");

        if (updateRecord && updateRecord.isAttributeModified(name))
            WebInspector.runCSSAnimationOnce(hasText ? attrValueElement : attrNameElement, "dom-update-highlight");

        /**
         * @this {WebInspector.ElementsTreeElement}
         * @param {string} value
         * @return {!Element}
         */
        function linkifyValue(value)
        {
            var rewrittenHref = node.resolveURL(value);
            if (rewrittenHref === null) {
                var span = createElement("span");
                setValueWithEntities.call(this, span, value);
                return span;
            }
            value = value.replace(closingPunctuationRegex, "$&\u200B");
            if (value.startsWith("data:"))
                value = value.trimMiddle(60);
            var anchor = WebInspector.linkifyURLAsNode(rewrittenHref, value, "", node.nodeName().toLowerCase() === "a");
            anchor.preventFollow = true;
            return anchor;
        }

        if (node && name === "src" || name === "href") {
            attrValueElement.appendChild(linkifyValue.call(this, value));
        } else if (node && node.nodeName().toLowerCase() === "img" && name === "srcset") {
            var sources = value.split(",");
            for (var i = 0; i < sources.length; ++i) {
                if (i > 0)
                    attrValueElement.createTextChild(", ");
                var source = sources[i].trim();
                var indexOfSpace = source.indexOf(" ");
                var url = source.substring(0, indexOfSpace);
                var tail = source.substring(indexOfSpace);
                attrValueElement.appendChild(linkifyValue.call(this, url));
                attrValueElement.createTextChild(tail);
            }
        } else {
            setValueWithEntities.call(this, attrValueElement, value);
        }

        if (hasText)
            attrSpanElement.createTextChild("\"");
    },

    /**
     * @param {!Node} parentElement
     * @param {string} pseudoElementName
     */
    _buildPseudoElementDOM: function(parentElement, pseudoElementName)
    {
        var pseudoElement = parentElement.createChild("span", "webkit-html-pseudo-element");
        pseudoElement.textContent = "::" + pseudoElementName;
        parentElement.createTextChild("\u200B");
    },

    /**
     * @param {!Node} parentElement
     * @param {string} tagName
     * @param {boolean} isClosingTag
     * @param {boolean} isDistinctTreeElement
     * @param {?WebInspector.ElementsTreeOutline.UpdateRecord} updateRecord
     */
    _buildTagDOM: function(parentElement, tagName, isClosingTag, isDistinctTreeElement, updateRecord)
    {
        var node = this._node;
        var classes = [ "webkit-html-tag" ];
        if (isClosingTag && isDistinctTreeElement)
            classes.push("close");
        var tagElement = parentElement.createChild("span", classes.join(" "));
        tagElement.createTextChild("<");
        var tagNameElement = tagElement.createChild("span", isClosingTag ? "webkit-html-close-tag-name" : "webkit-html-tag-name");
        tagNameElement.textContent = (isClosingTag ? "/" : "") + tagName;
        if (!isClosingTag) {
            if (node.hasAttributes()) {
                var attributes = node.attributes();
                for (var i = 0; i < attributes.length; ++i) {
                    var attr = attributes[i];
                    tagElement.createTextChild(" ");
                    this._buildAttributeDOM(tagElement, attr.name, attr.value, updateRecord, false, node);
                }
            }
            if (updateRecord) {
                var hasUpdates = updateRecord.hasRemovedAttributes() || updateRecord.hasRemovedChildren();
                hasUpdates |= !this.expanded && updateRecord.hasChangedChildren();
                if (hasUpdates)
                    WebInspector.runCSSAnimationOnce(tagNameElement, "dom-update-highlight");
            }
        }

        tagElement.createTextChild(">");
        parentElement.createTextChild("\u200B");
    },

    /**
     * @param {string} text
     * @return {!{text: string, entityRanges: !Array.<!WebInspector.SourceRange>}}
     */
    _convertWhitespaceToEntities: function(text)
    {
        var result = "";
        var lastIndexAfterEntity = 0;
        var entityRanges = [];
        var charToEntity = WebInspector.ElementsTreeOutline.MappedCharToEntity;
        for (var i = 0, size = text.length; i < size; ++i) {
            var char = text.charAt(i);
            if (charToEntity[char]) {
                result += text.substring(lastIndexAfterEntity, i);
                var entityValue = "&" + charToEntity[char] + ";";
                entityRanges.push({offset: result.length, length: entityValue.length});
                result += entityValue;
                lastIndexAfterEntity = i + 1;
            }
        }
        if (result)
            result += text.substring(lastIndexAfterEntity);
        return {text: result || text, entityRanges: entityRanges};
    },

    /**
     * @param {?WebInspector.ElementsTreeOutline.UpdateRecord} updateRecord
     * @return {!DocumentFragment} result
     */
    _nodeTitleInfo: function(updateRecord)
    {
        var node = this._node;
        var titleDOM = createDocumentFragment();

        switch (node.nodeType()) {
            case Node.ATTRIBUTE_NODE:
                this._buildAttributeDOM(titleDOM, /** @type {string} */ (node.name), /** @type {string} */ (node.value), updateRecord, true);
                break;

            case Node.ELEMENT_NODE:
                var pseudoType = node.pseudoType();
                if (pseudoType) {
                    this._buildPseudoElementDOM(titleDOM, pseudoType);
                    break;
                }

                var tagName = node.nodeNameInCorrectCase();
                if (this._elementCloseTag) {
                    this._buildTagDOM(titleDOM, tagName, true, true, updateRecord);
                    break;
                }

                this._buildTagDOM(titleDOM, tagName, false, false, updateRecord);

                if (this.isExpandable()) {
                    if (!this.expanded) {
                        var textNodeElement = titleDOM.createChild("span", "webkit-html-text-node bogus");
                        textNodeElement.textContent = "\u2026";
                        titleDOM.createTextChild("\u200B");
                        this._buildTagDOM(titleDOM, tagName, true, false, updateRecord);
                    }
                    break;
                }

                if (WebInspector.ElementsTreeElement.canShowInlineText(node)) {
                    var textNodeElement = titleDOM.createChild("span", "webkit-html-text-node");
                    var result = this._convertWhitespaceToEntities(node.firstChild.nodeValue());
                    textNodeElement.textContent = result.text;
                    WebInspector.highlightRangesWithStyleClass(textNodeElement, result.entityRanges, "webkit-html-entity-value");
                    titleDOM.createTextChild("\u200B");
                    this._buildTagDOM(titleDOM, tagName, true, false, updateRecord);
                    if (updateRecord && updateRecord.hasChangedChildren())
                        WebInspector.runCSSAnimationOnce(textNodeElement, "dom-update-highlight");
                    if (updateRecord && updateRecord.isCharDataModified())
                        WebInspector.runCSSAnimationOnce(textNodeElement, "dom-update-highlight");
                    break;
                }

                if (this.treeOutline.isXMLMimeType || !WebInspector.ElementsTreeElement.ForbiddenClosingTagElements[tagName])
                    this._buildTagDOM(titleDOM, tagName, true, false, updateRecord);
                break;

            case Node.TEXT_NODE:
                if (node.parentNode && node.parentNode.nodeName().toLowerCase() === "script") {
                    var newNode = titleDOM.createChild("span", "webkit-html-text-node webkit-html-js-node");
                    newNode.textContent = node.nodeValue();

                    var javascriptSyntaxHighlighter = new WebInspector.DOMSyntaxHighlighter("text/javascript", true);
                    javascriptSyntaxHighlighter.syntaxHighlightNode(newNode).then(updateSearchHighlight.bind(this));
                } else if (node.parentNode && node.parentNode.nodeName().toLowerCase() === "style") {
                    var newNode = titleDOM.createChild("span", "webkit-html-text-node webkit-html-css-node");
                    newNode.textContent = node.nodeValue();

                    var cssSyntaxHighlighter = new WebInspector.DOMSyntaxHighlighter("text/css", true);
                    cssSyntaxHighlighter.syntaxHighlightNode(newNode).then(updateSearchHighlight.bind(this));
                } else {
                    titleDOM.createTextChild("\"");
                    var textNodeElement = titleDOM.createChild("span", "webkit-html-text-node");
                    var result = this._convertWhitespaceToEntities(node.nodeValue());
                    textNodeElement.textContent = result.text;
                    WebInspector.highlightRangesWithStyleClass(textNodeElement, result.entityRanges, "webkit-html-entity-value");
                    titleDOM.createTextChild("\"");
                    if (updateRecord && updateRecord.isCharDataModified())
                        WebInspector.runCSSAnimationOnce(textNodeElement, "dom-update-highlight");
                }
                break;

            case Node.COMMENT_NODE:
                var commentElement = titleDOM.createChild("span", "webkit-html-comment");
                commentElement.createTextChild("<!--" + node.nodeValue() + "-->");
                break;

            case Node.DOCUMENT_TYPE_NODE:
                var docTypeElement = titleDOM.createChild("span", "webkit-html-doctype");
                docTypeElement.createTextChild("<!DOCTYPE " + node.nodeName());
                if (node.publicId) {
                    docTypeElement.createTextChild(" PUBLIC \"" + node.publicId + "\"");
                    if (node.systemId)
                        docTypeElement.createTextChild(" \"" + node.systemId + "\"");
                } else if (node.systemId)
                    docTypeElement.createTextChild(" SYSTEM \"" + node.systemId + "\"");

                if (node.internalSubset)
                    docTypeElement.createTextChild(" [" + node.internalSubset + "]");

                docTypeElement.createTextChild(">");
                break;

            case Node.CDATA_SECTION_NODE:
                var cdataElement = titleDOM.createChild("span", "webkit-html-text-node");
                cdataElement.createTextChild("<![CDATA[" + node.nodeValue() + "]]>");
                break;

            case Node.DOCUMENT_FRAGMENT_NODE:
                var fragmentElement = titleDOM.createChild("span", "webkit-html-fragment");
                fragmentElement.textContent = node.nodeNameInCorrectCase().collapseWhitespace();
                break;
            default:
                titleDOM.createTextChild(node.nodeNameInCorrectCase().collapseWhitespace());
        }

        /**
         * @this {WebInspector.ElementsTreeElement}
         */
        function updateSearchHighlight()
        {
            delete this._highlightResult;
            this._highlightSearchResults();
        }

        return titleDOM;
    },

    remove: function()
    {
        if (this._node.pseudoType())
            return;
        var parentElement = this.parent;
        if (!parentElement)
            return;

        if (!this._node.parentNode || this._node.parentNode.nodeType() === Node.DOCUMENT_NODE)
            return;
        this._node.removeNode();
    },

    /**
     * @param {function(boolean)=} callback
     * @param {boolean=} startEditing
     */
    toggleEditAsHTML: function(callback, startEditing)
    {
        if (this._editing && this._htmlEditElement && WebInspector.isBeingEdited(this._htmlEditElement)) {
            this._editing.commit();
            return;
        }

        if (startEditing === false)
            return;

        /**
         * @param {?Protocol.Error} error
         */
        function selectNode(error)
        {
            if (callback)
                callback(!error);
        }

        /**
         * @param {string} initialValue
         * @param {string} value
         */
        function commitChange(initialValue, value)
        {
            if (initialValue !== value)
                node.setOuterHTML(value, selectNode);
        }

        function disposeCallback()
        {
            if (callback)
                callback(false);
        }

        var node = this._node;
        node.getOuterHTML(this._startEditingAsHTML.bind(this, commitChange, disposeCallback));
    },

    _copyCSSPath: function()
    {
        InspectorFrontendHost.copyText(WebInspector.DOMPresentationUtils.cssPath(this._node, true));
    },

    _copyXPath: function()
    {
        InspectorFrontendHost.copyText(WebInspector.DOMPresentationUtils.xPath(this._node, true));
    },

    _highlightSearchResults: function()
    {
        if (!this._searchQuery || !this._searchHighlightsVisible)
            return;
        this._hideSearchHighlight();

        var text = this.listItemElement.textContent;
        var regexObject = createPlainTextSearchRegex(this._searchQuery, "gi");

        var match = regexObject.exec(text);
        var matchRanges = [];
        while (match) {
            matchRanges.push(new WebInspector.SourceRange(match.index, match[0].length));
            match = regexObject.exec(text);
        }

        // Fall back for XPath, etc. matches.
        if (!matchRanges.length)
            matchRanges.push(new WebInspector.SourceRange(0, text.length));

        this._highlightResult = [];
        WebInspector.highlightSearchResults(this.listItemElement, matchRanges, this._highlightResult);
    },

    _scrollIntoView: function()
    {
        function scrollIntoViewCallback(object)
        {
            /**
             * @suppressReceiverCheck
             * @this {!Element}
             */
            function scrollIntoView()
            {
                this.scrollIntoViewIfNeeded(true);
            }

            if (object)
                object.callFunction(scrollIntoView);
        }

        this._node.resolveToObject("", scrollIntoViewCallback);
    },

    __proto__: TreeElement.prototype
}
;/* ElementsTreeOutline.js */
/*
 * Copyright (C) 2007, 2008 Apple Inc.  All rights reserved.
 * Copyright (C) 2008 Matt Lilek <webkit@mattlilek.com>
 * Copyright (C) 2009 Joseph Pecoraro
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
 * @extends {TreeOutline}
 * @param {!WebInspector.DOMModel} domModel
 * @param {boolean=} omitRootDOMNode
 * @param {boolean=} selectEnabled
 */
WebInspector.ElementsTreeOutline = function(domModel, omitRootDOMNode, selectEnabled)
{
    this._domModel = domModel;
    this._treeElementSymbol = Symbol("treeElement");

    var element = createElement("div");

    this._shadowRoot = WebInspector.createShadowRootWithCoreStyles(element, "elements/elementsTreeOutline.css");
    var outlineDisclosureElement = this._shadowRoot.createChild("div", "elements-disclosure");

    TreeOutline.call(this);
    this._element = this.element;
    this._element.classList.add("elements-tree-outline", "source-code");
    this._element.addEventListener("mousedown", this._onmousedown.bind(this), false);
    this._element.addEventListener("mousemove", this._onmousemove.bind(this), false);
    this._element.addEventListener("mouseleave", this._onmouseleave.bind(this), false);
    this._element.addEventListener("dragstart", this._ondragstart.bind(this), false);
    this._element.addEventListener("dragover", this._ondragover.bind(this), false);
    this._element.addEventListener("dragleave", this._ondragleave.bind(this), false);
    this._element.addEventListener("drop", this._ondrop.bind(this), false);
    this._element.addEventListener("dragend", this._ondragend.bind(this), false);
    this._element.addEventListener("contextmenu", this._contextMenuEventFired.bind(this), false);

    outlineDisclosureElement.appendChild(this._element);
    this.element = element;

    this._includeRootDOMNode = !omitRootDOMNode;
    this._selectEnabled = selectEnabled;
    /** @type {?WebInspector.DOMNode} */
    this._rootDOMNode = null;
    /** @type {?WebInspector.DOMNode} */
    this._selectedDOMNode = null;

    this._visible = false;

    this._popoverHelper = new WebInspector.PopoverHelper(this._element, this._getPopoverAnchor.bind(this), this._showPopover.bind(this));
    this._popoverHelper.setTimeout(0);

    /** @type {!Map<!WebInspector.DOMNode, !WebInspector.ElementsTreeOutline.UpdateRecord>} */
    this._updateRecords = new Map();
    /** @type {!Set<!WebInspector.ElementsTreeElement>} */
    this._treeElementsBeingUpdated = new Set();

    this._domModel.addEventListener(WebInspector.DOMModel.Events.MarkersChanged, this._markersChanged, this);
}

/** @typedef {{node: !WebInspector.DOMNode, isCut: boolean}} */
WebInspector.ElementsTreeOutline.ClipboardData;

/**
 * @enum {string}
 */
WebInspector.ElementsTreeOutline.Events = {
    SelectedNodeChanged: "SelectedNodeChanged",
    ElementsTreeUpdated: "ElementsTreeUpdated"
}

/**
 * @const
 * @type {!Object.<string, string>}
 */
WebInspector.ElementsTreeOutline.MappedCharToEntity = {
    "\u00a0": "nbsp",
    "\u0093": "#147", // <control>
    "\u00ad": "shy",
    "\u2002": "ensp",
    "\u2003": "emsp",
    "\u2009": "thinsp",
    "\u200a": "#8202", // Hairspace
    "\u200b": "#8203", // ZWSP
    "\u200c": "zwnj",
    "\u200d": "zwj",
    "\u200e": "lrm",
    "\u200f": "rlm",
    "\u202a": "#8234", // LRE
    "\u202b": "#8235", // RLE
    "\u202c": "#8236", // PDF
    "\u202d": "#8237", // LRO
    "\u202e": "#8238", // RLO
    "\ufeff": "#65279" // BOM
}

WebInspector.ElementsTreeOutline.prototype = {
    /**
     * @return {symbol}
     */
    treeElementSymbol: function()
    {
        return this._treeElementSymbol;
    },

    focus: function()
    {
        this._element.focus();
    },

    /**
     * @return {boolean}
     */
    hasFocus: function()
    {
        return this._element === WebInspector.currentFocusElement();
    },

    /**
     * @param {boolean} wrap
     */
    setWordWrap: function(wrap)
    {
        this._element.classList.toggle("elements-tree-nowrap", !wrap);
    },

    /**
     * @return {!WebInspector.DOMModel}
     */
    domModel: function()
    {
        return this._domModel;
    },

    /**
     * @param {?WebInspector.InplaceEditor.Controller} multilineEditing
     */
    setMultilineEditing: function(multilineEditing)
    {
        this._multilineEditing = multilineEditing;
    },

    /**
     * @return {number}
     */
    visibleWidth: function()
    {
        return this._visibleWidth;
    },

    /**
     * @param {number} width
     */
    setVisibleWidth: function(width)
    {
        this._visibleWidth = width;
        if (this._multilineEditing)
            this._multilineEditing.setWidth(this._visibleWidth);
    },

    /**
     * @param {?WebInspector.ElementsTreeOutline.ClipboardData} data
     */
    _setClipboardData: function(data)
    {
        if (this._clipboardNodeData) {
            var treeElement = this.findTreeElement(this._clipboardNodeData.node);
            if (treeElement)
                treeElement.setInClipboard(false);
            delete this._clipboardNodeData;
        }

        if (data) {
            var treeElement = this.findTreeElement(data.node);
            if (treeElement)
                treeElement.setInClipboard(true);
            this._clipboardNodeData = data;
        }
    },

    /**
     * @param {!WebInspector.DOMNode} removedNode
     */
    resetClipboardIfNeeded: function(removedNode)
    {
        if (this._clipboardNodeData && this._clipboardNodeData.node === removedNode)
            this._setClipboardData(null);
    },

    /**
     * @param {boolean} isCut
     * @param {!Event} event
     */
    handleCopyOrCutKeyboardEvent: function(isCut, event)
    {
        this._setClipboardData(null);

        // Don't prevent the normal copy if the user has a selection.
        if (!event.target.isComponentSelectionCollapsed())
            return;

        // Do not interfere with text editing.
        if (WebInspector.isEditing())
            return;

        var targetNode = this.selectedDOMNode();
        if (!targetNode)
            return;

        event.clipboardData.clearData();
        event.preventDefault();

        this.performCopyOrCut(isCut, targetNode);
    },

    /**
     * @param {boolean} isCut
     * @param {?WebInspector.DOMNode} node
     */
    performCopyOrCut: function(isCut, node)
    {
        if (isCut && (node.isShadowRoot() || node.ancestorUserAgentShadowRoot()))
            return;

        node.copyNode();
        this._setClipboardData({ node: node, isCut: isCut });
    },

    /**
     * @param {!WebInspector.DOMNode} targetNode
     * @return {boolean}
     */
    canPaste: function(targetNode)
    {
        if (targetNode.isShadowRoot() || targetNode.ancestorUserAgentShadowRoot())
            return false;

        if (!this._clipboardNodeData)
            return false;

        var node = this._clipboardNodeData.node;
        if (this._clipboardNodeData.isCut && (node === targetNode || node.isAncestor(targetNode)))
            return false;

        if (targetNode.target() !== node.target())
            return false;
        return true;
    },

    /**
     * @param {!WebInspector.DOMNode} targetNode
     */
    pasteNode: function(targetNode)
    {
        if (this.canPaste(targetNode))
            this._performPaste(targetNode);
    },

    /**
     * @param {!Event} event
     */
    handlePasteKeyboardEvent: function(event)
    {
        // Do not interfere with text editing.
        if (WebInspector.isEditing())
            return;

        var targetNode = this.selectedDOMNode();
        if (!targetNode || !this.canPaste(targetNode))
            return;

        event.preventDefault();
        this._performPaste(targetNode);
    },

    /**
     * @param {!WebInspector.DOMNode} targetNode
     */
    _performPaste: function(targetNode)
    {
        if (this._clipboardNodeData.isCut) {
            this._clipboardNodeData.node.moveTo(targetNode, null, expandCallback.bind(this));
            this._setClipboardData(null);
        } else {
            this._clipboardNodeData.node.copyTo(targetNode, null, expandCallback.bind(this));
        }

        /**
         * @param {?Protocol.Error} error
         * @param {!DOMAgent.NodeId} nodeId
         * @this {WebInspector.ElementsTreeOutline}
         */
        function expandCallback(error, nodeId)
        {
            if (error)
                return;
            var pastedNode = this._domModel.nodeForId(nodeId);
            if (!pastedNode)
                return;
            this.selectDOMNode(pastedNode);
        }
    },

    /**
     * @param {boolean} visible
     */
    setVisible: function(visible)
    {
        this._visible = visible;
        if (!this._visible) {
            this._popoverHelper.hidePopover();
            if (this._multilineEditing)
                this._multilineEditing.cancel();
            return;
        }

        this.runPendingUpdates();
        if (this._selectedDOMNode)
            this._revealAndSelectNode(this._selectedDOMNode, false);
    },

    get rootDOMNode()
    {
        return this._rootDOMNode;
    },

    set rootDOMNode(x)
    {
        if (this._rootDOMNode === x)
            return;

        this._rootDOMNode = x;

        this._isXMLMimeType = x && x.isXMLNode();

        this.update();
    },

    get isXMLMimeType()
    {
        return this._isXMLMimeType;
    },

    /**
     * @return {?WebInspector.DOMNode}
     */
    selectedDOMNode: function()
    {
        return this._selectedDOMNode;
    },

    /**
     * @param {?WebInspector.DOMNode} node
     * @param {boolean=} focus
     */
    selectDOMNode: function(node, focus)
    {
        if (this._selectedDOMNode === node) {
            this._revealAndSelectNode(node, !focus);
            return;
        }

        this._selectedDOMNode = node;
        this._revealAndSelectNode(node, !focus);

        // The _revealAndSelectNode() method might find a different element if there is inlined text,
        // and the select() call would change the selectedDOMNode and reenter this setter. So to
        // avoid calling _selectedNodeChanged() twice, first check if _selectedDOMNode is the same
        // node as the one passed in.
        if (this._selectedDOMNode === node)
            this._selectedNodeChanged();
    },

    /**
     * @return {boolean}
     */
    editing: function()
    {
        var node = this.selectedDOMNode();
        if (!node)
            return false;
        var treeElement = this.findTreeElement(node);
        if (!treeElement)
            return false;
        return treeElement.isEditing() || false;
    },

    update: function()
    {
        var selectedTreeElement = this.selectedTreeElement;
        if (!(selectedTreeElement instanceof WebInspector.ElementsTreeElement))
            selectedTreeElement = null;

        var selectedNode = selectedTreeElement ? selectedTreeElement.node() : null;

        this.removeChildren();

        if (!this.rootDOMNode)
            return;

        var treeElement;
        if (this._includeRootDOMNode) {
            treeElement = this._createElementTreeElement(this.rootDOMNode);
            this.appendChild(treeElement);
        } else {
            // FIXME: this could use findTreeElement to reuse a tree element if it already exists
            var node = this.rootDOMNode.firstChild;
            while (node) {
                treeElement = this._createElementTreeElement(node);
                this.appendChild(treeElement);
                node = node.nextSibling;
            }
        }

        if (selectedNode)
            this._revealAndSelectNode(selectedNode, true);
    },

    updateSelection: function()
    {
        if (!this.selectedTreeElement)
            return;
        var element = this.selectedTreeElement;
        element.updateSelection();
    },

    _selectedNodeChanged: function()
    {
        this.dispatchEventToListeners(WebInspector.ElementsTreeOutline.Events.SelectedNodeChanged, this._selectedDOMNode);
    },

    /**
     * @param {!Array.<!WebInspector.DOMNode>} nodes
     */
    _fireElementsTreeUpdated: function(nodes)
    {
        this.dispatchEventToListeners(WebInspector.ElementsTreeOutline.Events.ElementsTreeUpdated, nodes);
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @return {?WebInspector.ElementsTreeElement}
     */
    findTreeElement: function(node)
    {
        var treeElement = this._lookUpTreeElement(node);
        if (!treeElement && node.nodeType() === Node.TEXT_NODE) {
            // The text node might have been inlined if it was short, so try to find the parent element.
            treeElement = this._lookUpTreeElement(node.parentNode);
        }

        return /** @type {?WebInspector.ElementsTreeElement} */ (treeElement);
    },

    /**
     * @param {?WebInspector.DOMNode} node
     * @return {?TreeElement}
     */
    _lookUpTreeElement: function(node)
    {
        if (!node)
            return null;

        var cachedElement = node[this._treeElementSymbol];
        if (cachedElement)
            return cachedElement;

        // Walk up the parent pointers from the desired node
        var ancestors = [];
        for (var currentNode = node.parentNode; currentNode; currentNode = currentNode.parentNode) {
            ancestors.push(currentNode);
            if (currentNode[this._treeElementSymbol])  // stop climbing as soon as we hit
                break;
        }

        if (!currentNode)
            return null;

        // Walk down to populate each ancestor's children, to fill in the tree and the cache.
        for (var i = ancestors.length - 1; i >= 0; --i) {
            var treeElement = ancestors[i][this._treeElementSymbol];
            if (treeElement)
                treeElement.onpopulate();  // fill the cache with the children of treeElement
        }

        return node[this._treeElementSymbol];
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @return {?WebInspector.ElementsTreeElement}
     */
    createTreeElementFor: function(node)
    {
        var treeElement = this.findTreeElement(node);
        if (treeElement)
            return treeElement;
        if (!node.parentNode)
            return null;

        treeElement = this.createTreeElementFor(node.parentNode);
        return treeElement ? this._showChild(treeElement, node) : null;
    },

    set suppressRevealAndSelect(x)
    {
        if (this._suppressRevealAndSelect === x)
            return;
        this._suppressRevealAndSelect = x;
    },

    /**
     * @param {?WebInspector.DOMNode} node
     * @param {boolean} omitFocus
     */
    _revealAndSelectNode: function(node, omitFocus)
    {
        if (this._suppressRevealAndSelect)
            return;

        if (!this._includeRootDOMNode && node === this.rootDOMNode && this.rootDOMNode)
            node = this.rootDOMNode.firstChild;
        if (!node)
            return;
        var treeElement = this.createTreeElementFor(node);
        if (!treeElement)
            return;

        treeElement.revealAndSelect(omitFocus);
    },

    /**
     * @return {?TreeElement}
     */
    _treeElementFromEvent: function(event)
    {
        var scrollContainer = this.element.parentElement;

        // We choose this X coordinate based on the knowledge that our list
        // items extend at least to the right edge of the outer <ol> container.
        // In the no-word-wrap mode the outer <ol> may be wider than the tree container
        // (and partially hidden), in which case we are left to use only its right boundary.
        var x = scrollContainer.totalOffsetLeft() + scrollContainer.offsetWidth - 36;

        var y = event.pageY;

        // Our list items have 1-pixel cracks between them vertically. We avoid
        // the cracks by checking slightly above and slightly below the mouse
        // and seeing if we hit the same element each time.
        var elementUnderMouse = this.treeElementFromPoint(x, y);
        var elementAboveMouse = this.treeElementFromPoint(x, y - 2);
        var element;
        if (elementUnderMouse === elementAboveMouse)
            element = elementUnderMouse;
        else
            element = this.treeElementFromPoint(x, y + 2);

        return element;
    },

    /**
     * @param {!Element} element
     * @param {!Event} event
     * @return {!Element|!AnchorBox|undefined}
     */
    _getPopoverAnchor: function(element, event)
    {
        var anchor = element.enclosingNodeOrSelfWithClass("webkit-html-resource-link");
        if (!anchor || !anchor.href)
            return;

        return anchor;
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @param {function()} callback
     */
    _loadDimensionsForNode: function(node, callback)
    {
        if (!node.nodeName() || node.nodeName().toLowerCase() !== "img") {
            callback();
            return;
        }

        node.resolveToObject("", resolvedNode);

        function resolvedNode(object)
        {
            if (!object) {
                callback();
                return;
            }

            object.callFunctionJSON(features, undefined, callback);
            object.release();

            /**
             * @return {!{offsetWidth: number, offsetHeight: number, naturalWidth: number, naturalHeight: number, currentSrc: (string|undefined)}}
             * @suppressReceiverCheck
             * @this {!Element}
             */
            function features()
            {
                return { offsetWidth: this.offsetWidth, offsetHeight: this.offsetHeight, naturalWidth: this.naturalWidth, naturalHeight: this.naturalHeight, currentSrc: this.currentSrc };
            }
        }
    },

    /**
     * @param {!Element} anchor
     * @param {!WebInspector.Popover} popover
     */
    _showPopover: function(anchor, popover)
    {
        var listItem = anchor.enclosingNodeOrSelfWithNodeName("li");
        var node = /** @type {!WebInspector.ElementsTreeElement} */ (listItem.treeElement).node();
        this._loadDimensionsForNode(node, WebInspector.DOMPresentationUtils.buildImagePreviewContents.bind(WebInspector.DOMPresentationUtils, node.target(), anchor.href, true, showPopover));

        /**
         * @param {!Element=} contents
         */
        function showPopover(contents)
        {
            if (!contents)
                return;
            popover.setCanShrink(false);
            popover.showForAnchor(contents, anchor);
        }
    },

    _onmousedown: function(event)
    {
        var element = this._treeElementFromEvent(event);

        if (!element || element.isEventWithinDisclosureTriangle(event))
            return;

        element.select();
    },

    /**
     * @param {?TreeElement} treeElement
     */
    setHoverEffect: function (treeElement)
    {
        if (this._previousHoveredElement === treeElement)
            return;

        if (this._previousHoveredElement) {
            this._previousHoveredElement.hovered = false;
            delete this._previousHoveredElement;
        }

        if (treeElement) {
            treeElement.hovered = true;
            this._previousHoveredElement = treeElement;
        }
    },

    _onmousemove: function(event)
    {
        var element = this._treeElementFromEvent(event);
        if (element && this._previousHoveredElement === element)
            return;

        this.setHoverEffect(element);

        if (element instanceof WebInspector.ElementsTreeElement) {
            this._domModel.highlightDOMNodeWithConfig(element.node().id, { mode: "all", showInfo: !WebInspector.KeyboardShortcut.eventHasCtrlOrMeta(event) });
            return;
        }

        if (element instanceof WebInspector.ElementsTreeOutline.ShortcutTreeElement)
            this._domModel.highlightDOMNodeWithConfig(undefined, { mode: "all", showInfo: !WebInspector.KeyboardShortcut.eventHasCtrlOrMeta(event) }, element.backendNodeId());
    },

    _onmouseleave: function(event)
    {
        this.setHoverEffect(null);
        WebInspector.DOMModel.hideDOMNodeHighlight();
    },

    _ondragstart: function(event)
    {
        if (!event.target.isComponentSelectionCollapsed())
            return false;
        if (event.target.nodeName === "A")
            return false;

        var treeElement = this._treeElementFromEvent(event);
        if (!this._isValidDragSourceOrTarget(treeElement))
            return false;

        if (treeElement.node().nodeName() === "BODY" || treeElement.node().nodeName() === "HEAD")
            return false;

        event.dataTransfer.setData("text/plain", treeElement.listItemElement.textContent.replace(/\u200b/g, ""));
        event.dataTransfer.effectAllowed = "copyMove";
        this._treeElementBeingDragged = treeElement;

        WebInspector.DOMModel.hideDOMNodeHighlight();

        return true;
    },

    _ondragover: function(event)
    {
        if (!this._treeElementBeingDragged)
            return false;

        var treeElement = this._treeElementFromEvent(event);
        if (!this._isValidDragSourceOrTarget(treeElement))
            return false;

        var node = treeElement.node();
        while (node) {
            if (node === this._treeElementBeingDragged._node)
                return false;
            node = node.parentNode;
        }

        treeElement.updateSelection();
        treeElement.listItemElement.classList.add("elements-drag-over");
        this._dragOverTreeElement = treeElement;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        return false;
    },

    _ondragleave: function(event)
    {
        this._clearDragOverTreeElementMarker();
        event.preventDefault();
        return false;
    },

    /**
     * @param {?TreeElement} treeElement
     * @return {boolean}
     */
    _isValidDragSourceOrTarget: function(treeElement)
    {
        if (!treeElement)
            return false;

        if (!(treeElement instanceof WebInspector.ElementsTreeElement))
            return false;
        var elementsTreeElement = /** @type {!WebInspector.ElementsTreeElement} */ (treeElement);

        var node = elementsTreeElement.node();
        if (!node.parentNode || node.parentNode.nodeType() !== Node.ELEMENT_NODE)
            return false;

        return true;
    },

    _ondrop: function(event)
    {
        event.preventDefault();
        var treeElement = this._treeElementFromEvent(event);
        if (treeElement)
            this._doMove(treeElement);
    },

    /**
     * @param {!TreeElement} treeElement
     */
    _doMove: function(treeElement)
    {
        if (!this._treeElementBeingDragged)
            return;

        var parentNode;
        var anchorNode;

        if (treeElement.isClosingTag()) {
            // Drop onto closing tag -> insert as last child.
            parentNode = treeElement.node();
        } else {
            var dragTargetNode = treeElement.node();
            parentNode = dragTargetNode.parentNode;
            anchorNode = dragTargetNode;
        }

        var wasExpanded = this._treeElementBeingDragged.expanded;
        this._treeElementBeingDragged._node.moveTo(parentNode, anchorNode, this.selectNodeAfterEdit.bind(this, wasExpanded));

        delete this._treeElementBeingDragged;
    },

    _ondragend: function(event)
    {
        event.preventDefault();
        this._clearDragOverTreeElementMarker();
        delete this._treeElementBeingDragged;
    },

    _clearDragOverTreeElementMarker: function()
    {
        if (this._dragOverTreeElement) {
            this._dragOverTreeElement.updateSelection();
            this._dragOverTreeElement.listItemElement.classList.remove("elements-drag-over");
            delete this._dragOverTreeElement;
        }
    },

    _contextMenuEventFired: function(event)
    {
        var treeElement = this._treeElementFromEvent(event);
        if (treeElement instanceof WebInspector.ElementsTreeElement)
            this.showContextMenu(treeElement, event);
    },

    /**
     * @param {!WebInspector.ElementsTreeElement} treeElement
     * @param {!Event} event
     */
    showContextMenu: function(treeElement, event)
    {
        if (WebInspector.isEditing())
            return;

        var contextMenu = new WebInspector.ContextMenu(event);
        var isPseudoElement = !!treeElement.node().pseudoType();
        var isTag = treeElement.node().nodeType() === Node.ELEMENT_NODE && !isPseudoElement;
        var textNode = event.target.enclosingNodeOrSelfWithClass("webkit-html-text-node");
        if (textNode && textNode.classList.contains("bogus"))
            textNode = null;
        var commentNode = event.target.enclosingNodeOrSelfWithClass("webkit-html-comment");
        contextMenu.appendApplicableItems(event.target);
        if (textNode) {
            contextMenu.appendSeparator();
            treeElement.populateTextContextMenu(contextMenu, textNode);
        } else if (isTag) {
            contextMenu.appendSeparator();
            treeElement.populateTagContextMenu(contextMenu, event);
        } else if (commentNode) {
            contextMenu.appendSeparator();
            treeElement.populateNodeContextMenu(contextMenu);
        } else if (isPseudoElement) {
            treeElement.populateScrollIntoView(contextMenu);
        }

        contextMenu.appendApplicableItems(treeElement.node());
        contextMenu.show();
    },

    runPendingUpdates: function()
    {
        this._updateModifiedNodes();
    },

    handleShortcut: function(event)
    {
        var node = this.selectedDOMNode();
        if (!node)
            return;
        var treeElement = node[this._treeElementSymbol];
        if (!treeElement)
            return;

        if (WebInspector.KeyboardShortcut.eventHasCtrlOrMeta(event) && node.parentNode) {
            if (event.keyIdentifier === "Up" && node.previousSibling) {
                node.moveTo(node.parentNode, node.previousSibling, this.selectNodeAfterEdit.bind(this, treeElement.expanded));
                event.handled = true;
                return;
            }
            if (event.keyIdentifier === "Down" && node.nextSibling) {
                node.moveTo(node.parentNode, node.nextSibling.nextSibling, this.selectNodeAfterEdit.bind(this, treeElement.expanded));
                event.handled = true;
                return;
            }
        }
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @param {boolean=} startEditing
     * @param {function()=} callback
     */
    toggleEditAsHTML: function(node, startEditing, callback)
    {
        var treeElement = node[this._treeElementSymbol];
        if (!treeElement || !treeElement.hasEditableNode())
            return;

        if (node.pseudoType())
            return;

        var parentNode = node.parentNode;
        var index = node.index;
        var wasExpanded = treeElement.expanded;

        treeElement.toggleEditAsHTML(editingFinished.bind(this), startEditing);

        /**
         * @this {WebInspector.ElementsTreeOutline}
         * @param {boolean} success
         */
        function editingFinished(success)
        {
            if (callback)
                callback();
            if (!success)
                return;

            // Select it and expand if necessary. We force tree update so that it processes dom events and is up to date.
            this.runPendingUpdates();

            var newNode = parentNode ? parentNode.children()[index] || parentNode : null;
            if (!newNode)
                return;

            this.selectDOMNode(newNode, true);

            if (wasExpanded) {
                var newTreeItem = this.findTreeElement(newNode);
                if (newTreeItem)
                    newTreeItem.expand();
            }
        }
    },

    /**
     * @param {boolean} wasExpanded
     * @param {?Protocol.Error} error
     * @param {!DOMAgent.NodeId=} nodeId
     * @return {?WebInspector.ElementsTreeElement} nodeId
     */
    selectNodeAfterEdit: function(wasExpanded, error, nodeId)
    {
        if (error)
            return null;

        // Select it and expand if necessary. We force tree update so that it processes dom events and is up to date.
        this.runPendingUpdates();

        var newNode = nodeId ? this._domModel.nodeForId(nodeId) : null;
        if (!newNode)
            return null;

        this.selectDOMNode(newNode, true);

        var newTreeItem = this.findTreeElement(newNode);
        if (wasExpanded) {
            if (newTreeItem)
                newTreeItem.expand();
        }
        return newTreeItem;
    },

    /**
     * Runs a script on the node's remote object that toggles a class name on
     * the node and injects a stylesheet into the head of the node's document
     * containing a rule to set "visibility: hidden" on the class and all it's
     * ancestors.
     *
     * @param {!WebInspector.DOMNode} node
     * @param {function(?WebInspector.RemoteObject, boolean=)=} userCallback
     */
    toggleHideElement: function(node, userCallback)
    {
        var pseudoType = node.pseudoType();
        var effectiveNode = pseudoType ? node.parentNode : node;
        if (!effectiveNode)
            return;

        var hidden = node.marker("hidden-marker");

        function resolvedNode(object)
        {
            if (!object)
                return;

            /**
             * @param {?string} pseudoType
             * @param {boolean} hidden
             * @suppressGlobalPropertiesCheck
             * @suppressReceiverCheck
             * @this {!Element}
             */
            function toggleClassAndInjectStyleRule(pseudoType, hidden)
            {
                const classNamePrefix = "__web-inspector-hide";
                const classNameSuffix = "-shortcut__";
                const styleTagId = "__web-inspector-hide-shortcut-style__";
                var selectors = [];
                selectors.push(".__web-inspector-hide-shortcut__");
                selectors.push(".__web-inspector-hide-shortcut__ *");
                selectors.push(".__web-inspector-hidebefore-shortcut__::before");
                selectors.push(".__web-inspector-hideafter-shortcut__::after");
                var selector = selectors.join(", ");
                var ruleBody = "    visibility: hidden !important;";
                var rule = "\n" + selector + "\n{\n" + ruleBody + "\n}\n";
                var className = classNamePrefix + (pseudoType || "") + classNameSuffix;
                this.classList.toggle(className, hidden);

                var localRoot = this;
                while (localRoot.parentNode)
                    localRoot = localRoot.parentNode;
                if (localRoot.nodeType === Node.DOCUMENT_NODE)
                    localRoot = document.head;

                var style = localRoot.querySelector("style#" + styleTagId);
                if (style)
                    return;

                style = document.createElement("style");
                style.id = styleTagId;
                style.type = "text/css";
                style.textContent = rule;

                localRoot.appendChild(style);
            }

            object.callFunction(toggleClassAndInjectStyleRule, [{ value: pseudoType }, { value: !hidden}], userCallback);
            object.release();
            node.setMarker("hidden-marker", hidden ? null : true);
        }

        effectiveNode.resolveToObject("", resolvedNode);
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @return {boolean}
     */
    isToggledToHidden: function(node)
    {
        return !!node.marker("hidden-marker");
    },

    _reset: function()
    {
        this.rootDOMNode = null;
        this.selectDOMNode(null, false);
        this._popoverHelper.hidePopover();
        delete this._clipboardNodeData;
        WebInspector.DOMModel.hideDOMNodeHighlight();
        this._updateRecords.clear();
    },

    wireToDOMModel: function()
    {
        this._domModel.addEventListener(WebInspector.DOMModel.Events.NodeInserted, this._nodeInserted, this);
        this._domModel.addEventListener(WebInspector.DOMModel.Events.NodeRemoved, this._nodeRemoved, this);
        this._domModel.addEventListener(WebInspector.DOMModel.Events.AttrModified, this._attributeModified, this);
        this._domModel.addEventListener(WebInspector.DOMModel.Events.AttrRemoved, this._attributeRemoved, this);
        this._domModel.addEventListener(WebInspector.DOMModel.Events.CharacterDataModified, this._characterDataModified, this);
        this._domModel.addEventListener(WebInspector.DOMModel.Events.DocumentUpdated, this._documentUpdated, this);
        this._domModel.addEventListener(WebInspector.DOMModel.Events.ChildNodeCountUpdated, this._childNodeCountUpdated, this);
        this._domModel.addEventListener(WebInspector.DOMModel.Events.DistributedNodesChanged, this._distributedNodesChanged, this);
    },

    unwireFromDOMModel: function()
    {
        this._domModel.removeEventListener(WebInspector.DOMModel.Events.NodeInserted, this._nodeInserted, this);
        this._domModel.removeEventListener(WebInspector.DOMModel.Events.NodeRemoved, this._nodeRemoved, this);
        this._domModel.removeEventListener(WebInspector.DOMModel.Events.AttrModified, this._attributeModified, this);
        this._domModel.removeEventListener(WebInspector.DOMModel.Events.AttrRemoved, this._attributeRemoved, this);
        this._domModel.removeEventListener(WebInspector.DOMModel.Events.CharacterDataModified, this._characterDataModified, this);
        this._domModel.removeEventListener(WebInspector.DOMModel.Events.DocumentUpdated, this._documentUpdated, this);
        this._domModel.removeEventListener(WebInspector.DOMModel.Events.ChildNodeCountUpdated, this._childNodeCountUpdated, this);
        this._domModel.removeEventListener(WebInspector.DOMModel.Events.DistributedNodesChanged, this._distributedNodesChanged, this);
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @return {!WebInspector.ElementsTreeOutline.UpdateRecord}
     */
    _addUpdateRecord: function(node)
    {
        var record = this._updateRecords.get(node);
        if (!record) {
            record = new WebInspector.ElementsTreeOutline.UpdateRecord();
            this._updateRecords.set(node, record);
        }
        return record;
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @return {?WebInspector.ElementsTreeOutline.UpdateRecord}
     */
    _updateRecordForHighlight: function(node)
    {
        if (!this._visible)
            return null;
        return this._updateRecords.get(node) || null;
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _documentUpdated: function(event)
    {
        var inspectedRootDocument = event.data;

        this._reset();

        if (!inspectedRootDocument)
            return;

        this.rootDOMNode = inspectedRootDocument;
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _attributeModified: function(event)
    {
        var node = /** @type {!WebInspector.DOMNode} */ (event.data.node);
        this._addUpdateRecord(node).attributeModified(event.data.name);
        this._updateModifiedNodesSoon();
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _attributeRemoved: function(event)
    {
        var node = /** @type {!WebInspector.DOMNode} */ (event.data.node);
        this._addUpdateRecord(node).attributeRemoved(event.data.name);
        this._updateModifiedNodesSoon();
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _characterDataModified: function(event)
    {
        var node = /** @type {!WebInspector.DOMNode} */ (event.data);
        this._addUpdateRecord(node).charDataModified();
        // Text could be large and force us to render itself as the child in the tree outline.
        if (node.parentNode && node.parentNode.firstChild === node.parentNode.lastChild)
            this._addUpdateRecord(node.parentNode).childrenModified();
        this._updateModifiedNodesSoon();
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _nodeInserted: function(event)
    {
        var node = /** @type {!WebInspector.DOMNode} */ (event.data);
        this._addUpdateRecord(/** @type {!WebInspector.DOMNode} */ (node.parentNode)).nodeInserted(node);
        this._updateModifiedNodesSoon();
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _nodeRemoved: function(event)
    {
        var node = /** @type {!WebInspector.DOMNode} */ (event.data.node);
        var parentNode = /** @type {!WebInspector.DOMNode} */ (event.data.parent);
        this.resetClipboardIfNeeded(node);
        this._addUpdateRecord(parentNode).nodeRemoved(node);
        this._updateModifiedNodesSoon();
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _childNodeCountUpdated: function(event)
    {
        var node = /** @type {!WebInspector.DOMNode} */ (event.data);
        this._addUpdateRecord(node).childrenModified();
        this._updateModifiedNodesSoon();
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _distributedNodesChanged: function(event)
    {
        var node = /** @type {!WebInspector.DOMNode} */ (event.data);
        this._addUpdateRecord(node).childrenModified();
        this._updateModifiedNodesSoon();
    },

    _updateModifiedNodesSoon: function()
    {
        if (!this._updateRecords.size)
            return;
        if (this._updateModifiedNodesTimeout)
            return;
        this._updateModifiedNodesTimeout = setTimeout(this._updateModifiedNodes.bind(this), 50);
    },

    _updateModifiedNodes: function()
    {
        if (this._updateModifiedNodesTimeout) {
            clearTimeout(this._updateModifiedNodesTimeout);
            delete this._updateModifiedNodesTimeout;
        }

        var updatedNodes = this._updateRecords.keysArray();
        var hidePanelWhileUpdating = updatedNodes.length > 10;
        if (hidePanelWhileUpdating) {
            var treeOutlineContainerElement = this.element.parentNode;
            var originalScrollTop = treeOutlineContainerElement ? treeOutlineContainerElement.scrollTop : 0;
            this._element.classList.add("hidden");
        }

        if (this._rootDOMNode && this._updateRecords.get(this._rootDOMNode) && this._updateRecords.get(this._rootDOMNode).hasChangedChildren()) {
            // Document's children have changed, perform total update.
            this.update();
        } else {
            for (var node of this._updateRecords.keys()) {
                if (this._updateRecords.get(node).hasChangedChildren())
                    this._updateModifiedParentNode(node);
                else
                    this._updateModifiedNode(node);
            }
        }

        if (hidePanelWhileUpdating) {
            this._element.classList.remove("hidden");
            if (originalScrollTop)
                treeOutlineContainerElement.scrollTop = originalScrollTop;
            this.updateSelection();
        }

        this._updateRecords.clear();
        this._fireElementsTreeUpdated(updatedNodes);
    },

    _updateModifiedNode: function(node)
    {
        var treeElement = this.findTreeElement(node);
        if (treeElement)
            treeElement.updateTitle(this._updateRecordForHighlight(node));
    },

    _updateModifiedParentNode: function(node)
    {
        var parentTreeElement = this.findTreeElement(node);
        if (parentTreeElement) {
            parentTreeElement.setExpandable(this._hasVisibleChildren(node));
            parentTreeElement.updateTitle(this._updateRecordForHighlight(node));
            if (parentTreeElement.populated)
                this._updateChildren(parentTreeElement);
        }
    },

    /**
     * @param {!WebInspector.ElementsTreeElement} treeElement
     */
    populateTreeElement: function(treeElement)
    {
        if (treeElement.childCount() || !treeElement.isExpandable())
            return;

        this._updateModifiedParentNode(treeElement.node());
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @param {boolean=} closingTag
     * @return {!WebInspector.ElementsTreeElement}
     */
    _createElementTreeElement: function(node, closingTag)
    {
        var treeElement = new WebInspector.ElementsTreeElement(node, closingTag);
        treeElement.setExpandable(!closingTag && this._hasVisibleChildren(node));
        if (node.nodeType() === Node.ELEMENT_NODE && node.parentNode && node.parentNode.nodeType() === Node.DOCUMENT_NODE && !node.parentNode.parentNode)
            treeElement.setCollapsible(false);
        treeElement.selectable = this._selectEnabled;
        return treeElement;
    },

    /**
     * @param {!WebInspector.ElementsTreeElement} treeElement
     * @param {!WebInspector.DOMNode} child
     * @return {?WebInspector.ElementsTreeElement}
     */
    _showChild: function(treeElement, child)
    {
        if (treeElement.isClosingTag())
            return null;

        var index = this._visibleChildren(treeElement.node()).indexOf(child);
        if (index === -1)
            return null;

        if (index >= treeElement.expandedChildrenLimit())
            this.setExpandedChildrenLimit(treeElement, index + 1);
        return /** @type {!WebInspector.ElementsTreeElement} */ (treeElement.childAt(index));
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @return {!Array.<!WebInspector.DOMNode>} visibleChildren
     */
    _visibleChildren: function(node)
    {
        var visibleChildren = WebInspector.ElementsTreeElement.visibleShadowRoots(node);

        if (node.importedDocument())
            visibleChildren.push(node.importedDocument());

        if (node.templateContent())
            visibleChildren.push(node.templateContent());

        var beforePseudoElement = node.beforePseudoElement();
        if (beforePseudoElement)
            visibleChildren.push(beforePseudoElement);

        if (node.childNodeCount())
            visibleChildren = visibleChildren.concat(node.children());

        var afterPseudoElement = node.afterPseudoElement();
        if (afterPseudoElement)
            visibleChildren.push(afterPseudoElement);

        return visibleChildren;
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @return {boolean}
     */
    _hasVisibleChildren: function(node)
    {
        if (node.importedDocument())
            return true;
        if (node.templateContent())
            return true;
        if (WebInspector.ElementsTreeElement.visibleShadowRoots(node).length)
            return true;
        if (node.hasPseudoElements())
            return true;
        if (node.isInsertionPoint())
            return true;
        return !!node.childNodeCount() && !WebInspector.ElementsTreeElement.canShowInlineText(node);
    },

    /**
     * @param {!WebInspector.ElementsTreeElement} treeElement
     */
    _createExpandAllButtonTreeElement: function(treeElement)
    {
        var button = createTextButton("", handleLoadAllChildren.bind(this));
        button.value = "";
        var expandAllButtonElement = new TreeElement(button);
        expandAllButtonElement.selectable = false;
        expandAllButtonElement.expandAllButton = true;
        expandAllButtonElement.button = button;
        return expandAllButtonElement;

        /**
         * @this {WebInspector.ElementsTreeOutline}
         * @param {!Event} event
         */
        function handleLoadAllChildren(event)
        {
            var visibleChildCount = this._visibleChildren(treeElement.node()).length;
            this.setExpandedChildrenLimit(treeElement, Math.max(visibleChildCount, treeElement.expandedChildrenLimit() + WebInspector.ElementsTreeElement.InitialChildrenLimit));
            event.consume();
        }
    },

    /**
     * @param {!WebInspector.ElementsTreeElement} treeElement
     * @param {number} expandedChildrenLimit
     */
    setExpandedChildrenLimit: function(treeElement, expandedChildrenLimit)
    {
        if (treeElement.expandedChildrenLimit() === expandedChildrenLimit)
            return;

        treeElement.setExpandedChildrenLimit(expandedChildrenLimit);
        if (treeElement.treeOutline && !this._treeElementsBeingUpdated.has(treeElement))
            this._updateModifiedParentNode(treeElement.node());
    },

    /**
     * @param {!WebInspector.ElementsTreeElement} treeElement
     */
    _updateChildren: function(treeElement)
    {
        if (!treeElement.isExpandable()) {
            var selectedTreeElement = treeElement.treeOutline.selectedTreeElement;
            if (selectedTreeElement && selectedTreeElement.hasAncestor(treeElement))
                treeElement.select(true);
            treeElement.removeChildren();
            return;
        }

        console.assert(!treeElement.isClosingTag());

        treeElement.node().getChildNodes(childNodesLoaded.bind(this));

       /**
         * @param {?Array.<!WebInspector.DOMNode>} children
         * @this {WebInspector.ElementsTreeOutline}
         */
        function childNodesLoaded(children)
        {
            // FIXME: sort this out, it should not happen.
            if (!children)
                return;
            this._innerUpdateChildren(treeElement);
        }
    },

    /**
     * @param {!WebInspector.ElementsTreeElement} treeElement
     * @param {!WebInspector.DOMNode} child
     * @param {number} index
     * @param {boolean=} closingTag
     * @return {!WebInspector.ElementsTreeElement}
     */
    insertChildElement: function(treeElement, child, index, closingTag)
    {
        var newElement = this._createElementTreeElement(child, closingTag);
        treeElement.insertChild(newElement, index);
        return newElement;
    },

    /**
     * @param {!WebInspector.ElementsTreeElement} treeElement
     * @param {!WebInspector.ElementsTreeElement} child
     * @param {number} targetIndex
     */
    _moveChild: function(treeElement, child, targetIndex)
    {
        if (treeElement.indexOfChild(child) === targetIndex)
            return;
        var wasSelected = child.selected;
        if (child.parent)
            child.parent.removeChild(child);
        treeElement.insertChild(child, targetIndex);
        if (wasSelected)
            child.select();
    },

    /**
     * @param {!WebInspector.ElementsTreeElement} treeElement
     */
    _innerUpdateChildren: function(treeElement)
    {
        if (this._treeElementsBeingUpdated.has(treeElement))
            return;

        this._treeElementsBeingUpdated.add(treeElement);

        var node = treeElement.node();
        var visibleChildren = this._visibleChildren(node);
        var visibleChildrenSet = new Set(visibleChildren);

        // Remove any tree elements that no longer have this node as their parent and save
        // all existing elements that could be reused. This also removes closing tag element.
        var existingTreeElements = new Map();
        for (var i = treeElement.childCount() - 1; i >= 0; --i) {
            var existingTreeElement = treeElement.childAt(i);
            if (!(existingTreeElement instanceof WebInspector.ElementsTreeElement)) {
                // Remove expand all button and shadow host toolbar.
                treeElement.removeChildAtIndex(i);
                continue;
            }
            var elementsTreeElement = /** @type {!WebInspector.ElementsTreeElement} */ (existingTreeElement);
            var existingNode = elementsTreeElement.node();

            if (visibleChildrenSet.has(existingNode)) {
                existingTreeElements.set(existingNode, existingTreeElement);
                continue;
            }

            treeElement.removeChildAtIndex(i);
        }

        for (var i = 0; i < visibleChildren.length && i < treeElement.expandedChildrenLimit(); ++i) {
            var child = visibleChildren[i];
            var existingTreeElement = existingTreeElements.get(child) || this.findTreeElement(child);
            if (existingTreeElement && existingTreeElement !== treeElement) {
                // If an existing element was found, just move it.
                this._moveChild(treeElement, existingTreeElement, i);
            } else {
                // No existing element found, insert a new element.
                var newElement = this.insertChildElement(treeElement, child, i);
                if (this._updateRecordForHighlight(node) && treeElement.expanded)
                    WebInspector.ElementsTreeElement.animateOnDOMUpdate(newElement);
                // If a node was inserted in the middle of existing list dynamically we might need to increase the limit.
                if (treeElement.childCount() > treeElement.expandedChildrenLimit())
                    this.setExpandedChildrenLimit(treeElement, treeElement.expandedChildrenLimit() + 1);
            }
        }

        // Update expand all button.
        var expandedChildCount = treeElement.childCount();
        if (visibleChildren.length > expandedChildCount) {
            var targetButtonIndex = expandedChildCount;
            if (!treeElement.expandAllButtonElement)
                treeElement.expandAllButtonElement = this._createExpandAllButtonTreeElement(treeElement);
            treeElement.insertChild(treeElement.expandAllButtonElement, targetButtonIndex);
            treeElement.expandAllButtonElement.button.textContent = WebInspector.UIString("Show All Nodes (%d More)", visibleChildren.length - expandedChildCount);
        } else if (treeElement.expandAllButtonElement) {
            delete treeElement.expandAllButtonElement;
        }

        // Insert shortcuts to distrubuted children.
        if (node.isInsertionPoint()) {
            for (var distributedNode of node.distributedNodes())
                treeElement.appendChild(new WebInspector.ElementsTreeOutline.ShortcutTreeElement(distributedNode));
        }

        // Insert close tag.
        if (node.nodeType() === Node.ELEMENT_NODE && treeElement.isExpandable())
            this.insertChildElement(treeElement, node, treeElement.childCount(), true);

        this._treeElementsBeingUpdated.delete(treeElement);
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _markersChanged: function(event)
    {
        var node = /** @type {!WebInspector.DOMNode} */ (event.data);
        var treeElement = node[this._treeElementSymbol];
        if (treeElement)
            treeElement.updateDecorations();
    },

    __proto__: TreeOutline.prototype
}

/**
 * @constructor
 */
WebInspector.ElementsTreeOutline.UpdateRecord = function()
{
}

WebInspector.ElementsTreeOutline.UpdateRecord.prototype = {
    /**
     * @param {string} attrName
     */
    attributeModified: function(attrName)
    {
        if (this._removedAttributes && this._removedAttributes.has(attrName))
            this._removedAttributes.delete(attrName);
        if (!this._modifiedAttributes)
            this._modifiedAttributes = /** @type {!Set.<string>} */ (new Set());
        this._modifiedAttributes.add(attrName);
    },

    /**
     * @param {string} attrName
     */
    attributeRemoved: function(attrName)
    {
        if (this._modifiedAttributes && this._modifiedAttributes.has(attrName))
            this._modifiedAttributes.delete(attrName);
        if (!this._removedAttributes)
            this._removedAttributes = /** @type {!Set.<string>} */ (new Set());
        this._removedAttributes.add(attrName);
    },

    /**
     * @param {!WebInspector.DOMNode} node
     */
    nodeInserted: function(node)
    {
        this._hasChangedChildren = true;
    },

    nodeRemoved: function(node)
    {
        this._hasChangedChildren = true;
        this._hasRemovedChildren = true;
    },

    charDataModified: function()
    {
        this._charDataModified = true;
    },

    childrenModified: function()
    {
        this._hasChangedChildren = true;
    },

    /**
     * @param {string} attributeName
     * @return {boolean}
     */
    isAttributeModified: function(attributeName)
    {
        return this._modifiedAttributes && this._modifiedAttributes.has(attributeName);
    },

    /**
     * @return {boolean}
     */
    hasRemovedAttributes: function()
    {
        return !!this._removedAttributes && !!this._removedAttributes.size;
    },

    /**
     * @return {boolean}
     */
    isCharDataModified: function()
    {
        return !!this._charDataModified;
    },

    /**
     * @return {boolean}
     */
    hasChangedChildren: function()
    {
        return !!this._hasChangedChildren;
    },

    /**
     * @return {boolean}
     */
    hasRemovedChildren: function()
    {
        return !!this._hasRemovedChildren;
    }
}

/**
 * @constructor
 * @implements {WebInspector.Renderer}
 */
WebInspector.ElementsTreeOutline.Renderer = function()
{
}

WebInspector.ElementsTreeOutline.Renderer.prototype = {
    /**
     * @override
     * @param {!Object} object
     * @return {!Promise.<!Element>}
     */
    render: function(object)
    {
        return new Promise(renderPromise);

        /**
         * @param {function(!Element)} resolve
         * @param {function(!Error)} reject
         */
        function renderPromise(resolve, reject)
        {
            if (object instanceof WebInspector.DOMNode) {
                onNodeResolved(/** @type {!WebInspector.DOMNode} */ (object));
            } else if (object instanceof WebInspector.DeferredDOMNode) {
                (/** @type {!WebInspector.DeferredDOMNode} */ (object)).resolve(onNodeResolved);
            } else if (object instanceof WebInspector.RemoteObject) {
                var domModel = WebInspector.DOMModel.fromTarget((/** @type {!WebInspector.RemoteObject} */ (object)).target());
                if (domModel)
                    domModel.pushObjectAsNodeToFrontend(object, onNodeResolved);
                else
                    reject(new Error("No dom model for given JS object target found."));
            } else {
                reject(new Error("Can't reveal not a node."));
            }

            /**
             * @param {?WebInspector.DOMNode} node
             */
            function onNodeResolved(node)
            {
                if (!node) {
                    reject(new Error("Could not resolve node."));
                    return;
                }
                var treeOutline = new WebInspector.ElementsTreeOutline(node.domModel(), false, false);
                treeOutline.rootDOMNode = node;
                if (!treeOutline.firstChild().isExpandable())
                    treeOutline._element.classList.add("single-node");
                treeOutline.setVisible(true);
                treeOutline.element.treeElementForTest = treeOutline.firstChild();
                resolve(treeOutline.element);
            }
        }
    }
}

/**
 * @constructor
 * @extends {TreeElement}
 * @param {!WebInspector.DOMNodeShortcut} nodeShortcut
 */
WebInspector.ElementsTreeOutline.ShortcutTreeElement = function(nodeShortcut)
{
    TreeElement.call(this, "");
    this.listItemElement.createChild("div", "selection fill");
    var title = this.listItemElement.createChild("span", "elements-tree-shortcut-title");
    var text = nodeShortcut.nodeName.toLowerCase();
    if (nodeShortcut.nodeType === Node.ELEMENT_NODE)
        text = "<" + text + ">";
    title.textContent = "\u21AA " + text;

    var link = WebInspector.DOMPresentationUtils.linkifyDeferredNodeReference(nodeShortcut.deferredNode);
    this.listItemElement.createTextChild(" ");
    link.classList.add("elements-tree-shortcut-link");
    link.textContent = WebInspector.UIString("reveal");
    this.listItemElement.appendChild(link);
    this._nodeShortcut = nodeShortcut;
}

WebInspector.ElementsTreeOutline.ShortcutTreeElement.prototype = {
    /**
     * @return {boolean}
     */
    get hovered()
    {
        return this._hovered;
    },

    set hovered(x)
    {
        if (this._hovered === x)
            return;
        this._hovered = x;
        this.listItemElement.classList.toggle("hovered", x);
    },

    updateSelection: function()
    {
    },

    /**
     * @return {number}
     */
    backendNodeId: function()
    {
        return this._nodeShortcut.deferredNode.backendNodeId();
    },

    /**
     * @override
     * @param {boolean=} selectedByUser
     * @return {boolean}
     */
    onselect: function(selectedByUser)
    {
        if (!selectedByUser)
            return true;
        this._nodeShortcut.deferredNode.highlight();
        this._nodeShortcut.deferredNode.resolve(resolved.bind(this));
        /**
         * @param {?WebInspector.DOMNode} node
         * @this {WebInspector.ElementsTreeOutline.ShortcutTreeElement}
         */
        function resolved(node)
        {
            if (node) {
                this.treeOutline._selectedDOMNode = node;
                this.treeOutline._selectedNodeChanged();
            }
        }
        return true;
    },

    __proto__: TreeElement.prototype
}
;/* SharedSidebarModel.js */
// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @extends {WebInspector.Object}
 * @constructor
 */
WebInspector.SharedSidebarModel = function()
{
    WebInspector.Object.call(this);
    this._node = WebInspector.context.flavor(WebInspector.DOMNode);
    WebInspector.context.addFlavorChangeListener(WebInspector.DOMNode, this._onNodeChanged, this);
}

/**
 * @param {?WebInspector.DOMNode} node
 * @return {?WebInspector.DOMNode}
 */
WebInspector.SharedSidebarModel.elementNode = function(node)
{
    if (node && node.nodeType() === Node.TEXT_NODE && node.parentNode)
        node = node.parentNode;

    if (node && node.nodeType() !== Node.ELEMENT_NODE)
        node = null;
    return node;
}

WebInspector.SharedSidebarModel.Events = {
    ComputedStyleChanged: "ComputedStyleChanged"
}

WebInspector.SharedSidebarModel.prototype = {
    /**
     * @return {?WebInspector.DOMNode}
     */
    node: function()
    {
        return this._node;
    },

    /**
     * @return {?WebInspector.CSSStyleModel}
     */
    cssModel: function()
    {
        return this._cssModel;
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _onNodeChanged: function(event)
    {
        this._node = /** @type {?WebInspector.DOMNode} */(event.data);
        this._updateTarget(this._node ? this._node.target() : null);
        this._onComputedStyleChanged();
    },

    /**
     * @param {?WebInspector.Target} target
     */
    _updateTarget: function(target)
    {
        if (this._target === target)
            return;
        if (this._targetEvents) {
            WebInspector.EventTarget.removeEventListeners(this._targetEvents);
            this._targetEvents = null;
        }
        this._target = target;
        var domModel = null;
        if (target) {
            this._cssModel = WebInspector.CSSStyleModel.fromTarget(target);
            domModel = WebInspector.DOMModel.fromTarget(target);
        }

        if (domModel && this._cssModel) {
            this._targetEvents = [
                this._cssModel.addEventListener(WebInspector.CSSStyleModel.Events.StyleSheetAdded,  this._onComputedStyleChanged, this),
                this._cssModel.addEventListener(WebInspector.CSSStyleModel.Events.StyleSheetRemoved,  this._onComputedStyleChanged, this),
                this._cssModel.addEventListener(WebInspector.CSSStyleModel.Events.StyleSheetChanged,  this._onComputedStyleChanged, this),
                this._cssModel.addEventListener(WebInspector.CSSStyleModel.Events.MediaQueryResultChanged,  this._onComputedStyleChanged, this),
                this._cssModel.addEventListener(WebInspector.CSSStyleModel.Events.PseudoStateForced,  this._onComputedStyleChanged, this),
                this._cssModel.addEventListener(WebInspector.CSSStyleModel.Events.ModelWasEnabled,  this._onComputedStyleChanged, this),
                domModel.addEventListener(WebInspector.DOMModel.Events.DOMMutated, this._onComputedStyleChanged, this)
            ];
        }
    },

    /**
     * @return {?WebInspector.DOMNode}
     */
    _elementNode: function()
    {
        return WebInspector.SharedSidebarModel.elementNode(this.node());
    },

    /**
     * @return {!Promise.<?WebInspector.SharedSidebarModel.ComputedStyle>}
     */
    fetchComputedStyle: function()
    {
        var elementNode = this._elementNode();
        var cssModel = this.cssModel();
        if (!elementNode || !cssModel)
            return Promise.resolve(/** @type {?WebInspector.SharedSidebarModel.ComputedStyle} */(null));

        if (!this._computedStylePromise)
            this._computedStylePromise = cssModel.computedStylePromise(elementNode.id).then(verifyOutdated.bind(this, elementNode));

        return this._computedStylePromise;

        /**
         * @param {!WebInspector.DOMNode} elementNode
         * @param {?Map.<string, string>} style
         * @return {?WebInspector.SharedSidebarModel.ComputedStyle}
         * @this {WebInspector.SharedSidebarModel}
         */
        function verifyOutdated(elementNode, style)
        {
            return elementNode === this._elementNode() && style ? new WebInspector.SharedSidebarModel.ComputedStyle(elementNode, style) : /** @type {?WebInspector.SharedSidebarModel.ComputedStyle} */(null);
        }
    },

    _onComputedStyleChanged: function()
    {
        delete this._computedStylePromise;
        this.dispatchEventToListeners(WebInspector.SharedSidebarModel.Events.ComputedStyleChanged);
    },

    __proto__: WebInspector.Object.prototype
}

/**
 * @constructor
 * @param {!WebInspector.DOMNode} node
 * @param {!Map.<string, string>} computedStyle
 */
WebInspector.SharedSidebarModel.ComputedStyle = function(node, computedStyle)
{
    this.node = node;
    this.computedStyle = computedStyle;
}
;/* EventListenersWidget.js */
/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
 * Copyright (C) 2009 Joseph Pecoraro
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
 * @extends {WebInspector.ThrottledWidget}
 */
WebInspector.EventListenersWidget = function()
{
    WebInspector.ThrottledWidget.call(this);
    this.element.classList.add("events-pane");

    this._showForAncestorsSetting = WebInspector.settings.createSetting("showEventListenersForAncestors", true);
    this._showForAncestorsSetting.addChangeListener(this.update.bind(this));
    this._showFrameworkListenersSetting = WebInspector.settings.createSetting("showFrameowkrListeners", true);
    this._showFrameworkListenersSetting.addChangeListener(this._showFrameworkListenersChanged.bind(this));
    this._eventListenersView = new WebInspector.EventListenersView(this.element);
    WebInspector.context.addFlavorChangeListener(WebInspector.DOMNode, this.update, this);
}

/**
 * @return {!WebInspector.ElementsSidebarViewWrapperPane}
 */
WebInspector.EventListenersWidget.createSidebarWrapper = function()
{
    var widget = new WebInspector.EventListenersWidget();
    var result = new WebInspector.ElementsSidebarViewWrapperPane(WebInspector.UIString("Event Listeners"), widget);
    var refreshButton = new WebInspector.ToolbarButton(WebInspector.UIString("Refresh"), "refresh-toolbar-item");
    refreshButton.addEventListener("click", widget.update.bind(widget));
    result.toolbar().appendToolbarItem(refreshButton);
    result.toolbar().appendToolbarItem(new WebInspector.ToolbarCheckbox(WebInspector.UIString("Ancestors"), WebInspector.UIString("Show listeners on the ancestors"), widget._showForAncestorsSetting));
    result.toolbar().appendToolbarItem(new WebInspector.ToolbarCheckbox(WebInspector.UIString("Framework listeners"), WebInspector.UIString("Resolve event listeners bound with framework"), widget._showFrameworkListenersSetting));
    return result;
}

WebInspector.EventListenersWidget._objectGroupName = "event-listeners-panel";

WebInspector.EventListenersWidget.prototype = {
    /**
     * @override
     * @protected
     * @return {!Promise.<?>}
     */
    doUpdate: function()
    {
        if (this._lastRequestedNode) {
            this._lastRequestedNode.target().runtimeAgent().releaseObjectGroup(WebInspector.EventListenersWidget._objectGroupName);
            delete this._lastRequestedNode;
        }
        var node = WebInspector.context.flavor(WebInspector.DOMNode);
        if (!node) {
            this._eventListenersView.reset();
            this._eventListenersView.addEmptyHolderIfNeeded();
            return Promise.resolve();
        }
        this._lastRequestedNode = node;
        var selectedNodeOnly = !this._showForAncestorsSetting.get();
        var promises = [];
        var listenersView = this._eventListenersView;
        promises.push(node.resolveToObjectPromise(WebInspector.EventListenersWidget._objectGroupName));
        if (!selectedNodeOnly) {
            var currentNode = node.parentNode;
            while (currentNode) {
                promises.push(currentNode.resolveToObjectPromise(WebInspector.EventListenersWidget._objectGroupName));
                currentNode = currentNode.parentNode;
            }
            promises.push(this._windowObjectInNodeContext(node));
        }
        return Promise.all(promises).then(this._eventListenersView.addObjects.bind(this._eventListenersView)).then(this._showFrameworkListenersChanged.bind(this));
    },


    _showFrameworkListenersChanged: function()
    {
        this._eventListenersView.showFrameworkListeners(this._showFrameworkListenersSetting.get());
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @return {!Promise<!WebInspector.RemoteObject>}
     */
    _windowObjectInNodeContext: function(node)
    {
        return new Promise(windowObjectInNodeContext);

        /**
         * @param {function(?)} fulfill
         * @param {function(*)} reject
         */
        function windowObjectInNodeContext(fulfill, reject)
        {
            var executionContexts = node.target().runtimeModel.executionContexts();
            var context = null;
            if (node.frameId()) {
                for (var i = 0; i < executionContexts.length; ++i) {
                    var executionContext = executionContexts[i];
                    if (executionContext.frameId === node.frameId() && executionContext.isMainWorldContext)
                        context = executionContext;
                }
            } else {
                context = executionContexts[0];
            }
            context.evaluate("self", WebInspector.EventListenersWidget._objectGroupName, false, true, false, false, fulfill);
        }
    },

    _eventListenersArrivedForTest: function()
    {
    },

    __proto__: WebInspector.ThrottledWidget.prototype
}
;/* MetricsSidebarPane.js */
/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
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
 * @extends {WebInspector.ElementsSidebarPane}
 */
WebInspector.MetricsSidebarPane = function()
{
    WebInspector.ElementsSidebarPane.call(this, WebInspector.UIString("Metrics"));
}

WebInspector.MetricsSidebarPane.prototype = {
    /**
     * @override
     * @protected
     * @return {!Promise.<?>}
     */
    doUpdate: function()
    {
        // "style" attribute might have changed. Update metrics unless they are being edited
        // (if a CSS property is added, a StyleSheetChanged event is dispatched).
        if (this._isEditingMetrics)
            return Promise.resolve();

        // FIXME: avoid updates of a collapsed pane.
        var node = this.node();
        var cssModel = this.cssModel();
        if (!node || node.nodeType() !== Node.ELEMENT_NODE || !cssModel) {
            this.element.removeChildren();
            return Promise.resolve();
        }

        /**
         * @param {?Map.<string, string>} style
         * @this {WebInspector.MetricsSidebarPane}
         */
        function callback(style)
        {
            if (!style || this.node() !== node)
                return;
            this._updateMetrics(style);
        }
        /**
         * @param {?WebInspector.CSSStyleModel.InlineStyleResult} inlineStyleResult
         * @this {WebInspector.MetricsSidebarPane}
         */
        function inlineStyleCallback(inlineStyleResult)
        {
            if (inlineStyleResult && this.node() === node)
                this.inlineStyle = inlineStyleResult.inlineStyle;
        }

        var promises = [
            cssModel.computedStylePromise(node.id).then(callback.bind(this)),
            cssModel.inlineStylesPromise(node.id).then(inlineStyleCallback.bind(this))
        ];
        return Promise.all(promises);
    },

    /**
     * @override
     */
    onDOMModelChanged: function()
    {
        this.update();
    },

    /**
     * @override
     */
    onCSSModelChanged: function()
    {
        this.update();
    },

    /**
     * @override
     */
    onFrameResizedThrottled: function()
    {
        this.update();
    },

    /**
     * @param {!Map.<string, string>} style
     * @param {string} propertyName
     * @return {number}
     */
    _getPropertyValueAsPx: function(style, propertyName)
    {
        return Number(style.get(propertyName).replace(/px$/, "") || 0);
    },

    /**
     * @param {!Map.<string, string>} computedStyle
     * @param {string} componentName
     */
    _getBox: function(computedStyle, componentName)
    {
        var suffix = componentName === "border" ? "-width" : "";
        var left = this._getPropertyValueAsPx(computedStyle, componentName + "-left" + suffix);
        var top = this._getPropertyValueAsPx(computedStyle, componentName + "-top" + suffix);
        var right = this._getPropertyValueAsPx(computedStyle, componentName + "-right" + suffix);
        var bottom = this._getPropertyValueAsPx(computedStyle, componentName + "-bottom" + suffix);
        return { left: left, top: top, right: right, bottom: bottom };
    },

    /**
     * @param {boolean} showHighlight
     * @param {string} mode
     * @param {!Event} event
     */
    _highlightDOMNode: function(showHighlight, mode, event)
    {
        event.consume();
        if (showHighlight && this.node()) {
            if (this._highlightMode === mode)
                return;
            this._highlightMode = mode;
            this.node().highlight(mode);
        } else {
            delete this._highlightMode;
            WebInspector.DOMModel.hideDOMNodeHighlight();
        }

        for (var i = 0; this._boxElements && i < this._boxElements.length; ++i) {
            var element = this._boxElements[i];
            if (!this.node() || mode === "all" || element._name === mode)
                element.style.backgroundColor = element._backgroundColor;
            else
                element.style.backgroundColor = "";
        }
    },

    /**
     * @param {!Map.<string, string>} style
     */
    _updateMetrics: function(style)
    {
        // Updating with computed style.
        var metricsElement = createElement("div");
        metricsElement.className = "metrics";
        var self = this;

        /**
         * @param {!Map.<string, string>} style
         * @param {string} name
         * @param {string} side
         * @param {string} suffix
         * @this {WebInspector.MetricsSidebarPane}
         */
        function createBoxPartElement(style, name, side, suffix)
        {
            var propertyName = (name !== "position" ? name + "-" : "") + side + suffix;
            var value = style.get(propertyName);
            if (value === "" || (name !== "position" && value === "0px"))
                value = "\u2012";
            else if (name === "position" && value === "auto")
                value = "\u2012";
            value = value.replace(/px$/, "");
            value = Number.toFixedIfFloating(value);

            var element = createElement("div");
            element.className = side;
            element.textContent = value;
            element.addEventListener("dblclick", this.startEditing.bind(this, element, name, propertyName, style), false);
            return element;
        }

        /**
         * @param {!Map.<string, string>} style
         * @return {string}
         */
        function getContentAreaWidthPx(style)
        {
            var width = style.get("width").replace(/px$/, "");
            if (!isNaN(width) && style.get("box-sizing") === "border-box") {
                var borderBox = self._getBox(style, "border");
                var paddingBox = self._getBox(style, "padding");

                width = width - borderBox.left - borderBox.right - paddingBox.left - paddingBox.right;
            }

            return Number.toFixedIfFloating(width.toString());
        }

        /**
         * @param {!Map.<string, string>} style
         * @return {string}
         */
        function getContentAreaHeightPx(style)
        {
            var height = style.get("height").replace(/px$/, "");
            if (!isNaN(height) && style.get("box-sizing") === "border-box") {
                var borderBox = self._getBox(style, "border");
                var paddingBox = self._getBox(style, "padding");

                height = height - borderBox.top - borderBox.bottom - paddingBox.top - paddingBox.bottom;
            }

            return Number.toFixedIfFloating(height.toString());
        }

        // Display types for which margin is ignored.
        var noMarginDisplayType = {
            "table-cell": true,
            "table-column": true,
            "table-column-group": true,
            "table-footer-group": true,
            "table-header-group": true,
            "table-row": true,
            "table-row-group": true
        };

        // Display types for which padding is ignored.
        var noPaddingDisplayType = {
            "table-column": true,
            "table-column-group": true,
            "table-footer-group": true,
            "table-header-group": true,
            "table-row": true,
            "table-row-group": true
        };

        // Position types for which top, left, bottom and right are ignored.
        var noPositionType = {
            "static": true
        };

        var boxes = ["content", "padding", "border", "margin", "position"];
        var boxColors = [
            WebInspector.Color.PageHighlight.Content,
            WebInspector.Color.PageHighlight.Padding,
            WebInspector.Color.PageHighlight.Border,
            WebInspector.Color.PageHighlight.Margin,
            WebInspector.Color.fromRGBA([0, 0, 0, 0])
        ];
        var boxLabels = [WebInspector.UIString("content"), WebInspector.UIString("padding"), WebInspector.UIString("border"), WebInspector.UIString("margin"), WebInspector.UIString("position")];
        var previousBox = null;
        this._boxElements = [];
        for (var i = 0; i < boxes.length; ++i) {
            var name = boxes[i];

            if (name === "margin" && noMarginDisplayType[style.get("display")])
                continue;
            if (name === "padding" && noPaddingDisplayType[style.get("display")])
                continue;
            if (name === "position" && noPositionType[style.get("position")])
                continue;

            var boxElement = createElement("div");
            boxElement.className = name;
            boxElement._backgroundColor = boxColors[i].asString(WebInspector.Color.Format.RGBA);
            boxElement._name = name;
            boxElement.style.backgroundColor = boxElement._backgroundColor;
            boxElement.addEventListener("mouseover", this._highlightDOMNode.bind(this, true, name === "position" ? "all" : name), false);
            this._boxElements.push(boxElement);

            if (name === "content") {
                var widthElement = createElement("span");
                widthElement.textContent = getContentAreaWidthPx(style);
                widthElement.addEventListener("dblclick", this.startEditing.bind(this, widthElement, "width", "width", style), false);

                var heightElement = createElement("span");
                heightElement.textContent = getContentAreaHeightPx(style);
                heightElement.addEventListener("dblclick", this.startEditing.bind(this, heightElement, "height", "height", style), false);

                boxElement.appendChild(widthElement);
                boxElement.createTextChild(" \u00D7 ");
                boxElement.appendChild(heightElement);
            } else {
                var suffix = (name === "border" ? "-width" : "");

                var labelElement = createElement("div");
                labelElement.className = "label";
                labelElement.textContent = boxLabels[i];
                boxElement.appendChild(labelElement);

                boxElement.appendChild(createBoxPartElement.call(this, style, name, "top", suffix));
                boxElement.appendChild(createElement("br"));
                boxElement.appendChild(createBoxPartElement.call(this, style, name, "left", suffix));

                if (previousBox)
                    boxElement.appendChild(previousBox);

                boxElement.appendChild(createBoxPartElement.call(this, style, name, "right", suffix));
                boxElement.appendChild(createElement("br"));
                boxElement.appendChild(createBoxPartElement.call(this, style, name, "bottom", suffix));
            }

            previousBox = boxElement;
        }

        metricsElement.appendChild(previousBox);
        metricsElement.addEventListener("mouseover", this._highlightDOMNode.bind(this, false, "all"), false);
        this.element.removeChildren();
        this.element.appendChild(metricsElement);
    },

    /**
     * @param {!Element} targetElement
     * @param {string} box
     * @param {string} styleProperty
     * @param {!Map.<string, string>} computedStyle
     */
    startEditing: function(targetElement, box, styleProperty, computedStyle)
    {
        if (WebInspector.isBeingEdited(targetElement))
            return;

        var context = { box: box, styleProperty: styleProperty, computedStyle: computedStyle };
        var boundKeyDown = this._handleKeyDown.bind(this, context, styleProperty);
        context.keyDownHandler = boundKeyDown;
        targetElement.addEventListener("keydown", boundKeyDown, false);

        this._isEditingMetrics = true;

        var config = new WebInspector.InplaceEditor.Config(this.editingCommitted.bind(this), this.editingCancelled.bind(this), context);
        WebInspector.InplaceEditor.startEditing(targetElement, config);

        targetElement.getComponentSelection().setBaseAndExtent(targetElement, 0, targetElement, 1);
    },

    _handleKeyDown: function(context, styleProperty, event)
    {
        var element = event.currentTarget;

        /**
         * @param {string} originalValue
         * @param {string} replacementString
         * @this {WebInspector.MetricsSidebarPane}
         */
        function finishHandler(originalValue, replacementString)
        {
            this._applyUserInput(element, replacementString, originalValue, context, false);
        }

        /**
         * @param {string} prefix
         * @param {number} number
         * @param {string} suffix
         * @return {string}
         */
        function customNumberHandler(prefix, number, suffix)
        {
            if (styleProperty !== "margin" && number < 0)
                number = 0;
            return prefix + number + suffix;
        }

        WebInspector.handleElementValueModifications(event, element, finishHandler.bind(this), undefined, customNumberHandler);
    },

    editingEnded: function(element, context)
    {
        delete this.originalPropertyData;
        delete this.previousPropertyDataCandidate;
        element.removeEventListener("keydown", context.keyDownHandler, false);
        delete this._isEditingMetrics;
    },

    editingCancelled: function(element, context)
    {
        if ("originalPropertyData" in this && this.inlineStyle) {
            if (!this.originalPropertyData) {
                // An added property, remove the last property in the style.
                var pastLastSourcePropertyIndex = this.inlineStyle.pastLastSourcePropertyIndex();
                if (pastLastSourcePropertyIndex)
                    this.inlineStyle.allProperties[pastLastSourcePropertyIndex - 1].setText("", false);
            } else
                this.inlineStyle.allProperties[this.originalPropertyData.index].setText(this.originalPropertyData.propertyText, false);
        }
        this.editingEnded(element, context);
        this.update();
    },

    _applyUserInput: function(element, userInput, previousContent, context, commitEditor)
    {
        if (!this.inlineStyle) {
            // Element has no renderer.
            return this.editingCancelled(element, context); // nothing changed, so cancel
        }

        if (commitEditor && userInput === previousContent)
            return this.editingCancelled(element, context); // nothing changed, so cancel

        if (context.box !== "position" && (!userInput || userInput === "\u2012"))
            userInput = "0px";
        else if (context.box === "position" && (!userInput || userInput === "\u2012"))
            userInput = "auto";

        userInput = userInput.toLowerCase();
        // Append a "px" unit if the user input was just a number.
        if (/^\d+$/.test(userInput))
            userInput += "px";

        var styleProperty = context.styleProperty;
        var computedStyle = context.computedStyle;

        if (computedStyle.get("box-sizing") === "border-box" && (styleProperty === "width" || styleProperty === "height")) {
            if (!userInput.match(/px$/)) {
                WebInspector.console.error("For elements with box-sizing: border-box, only absolute content area dimensions can be applied");
                return;
            }

            var borderBox = this._getBox(computedStyle, "border");
            var paddingBox = this._getBox(computedStyle, "padding");
            var userValuePx = Number(userInput.replace(/px$/, ""));
            if (isNaN(userValuePx))
                return;
            if (styleProperty === "width")
                userValuePx += borderBox.left + borderBox.right + paddingBox.left + paddingBox.right;
            else
                userValuePx += borderBox.top + borderBox.bottom + paddingBox.top + paddingBox.bottom;

            userInput = userValuePx + "px";
        }

        this.previousPropertyDataCandidate = null;

        var allProperties = this.inlineStyle.allProperties;
        for (var i = 0; i < allProperties.length; ++i) {
            var property = allProperties[i];
            if (property.name !== context.styleProperty || !property.activeInStyle())
                continue;

            this.previousPropertyDataCandidate = property;
            property.setValue(userInput, commitEditor, true, callback.bind(this));
            return;
        }

        this.inlineStyle.appendProperty(context.styleProperty, userInput, callback.bind(this));

        /**
         * @param {boolean} success
         * @this {WebInspector.MetricsSidebarPane}
         */
        function callback(success)
        {
            if (!success)
                return;
            if (!("originalPropertyData" in this))
                this.originalPropertyData = this.previousPropertyDataCandidate;

            if (typeof this._highlightMode !== "undefined")
                this._node.highlight(this._highlightMode);

            if (commitEditor)
                this.update();
        }
    },

    editingCommitted: function(element, userInput, previousContent, context)
    {
        this.editingEnded(element, context);
        this._applyUserInput(element, userInput, previousContent, context, true);
    },

    __proto__: WebInspector.ElementsSidebarPane.prototype
}
;/* PlatformFontsWidget.js */
/*
 * Copyright (C) 2013 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @constructor
 * @extends {WebInspector.ThrottledWidget}
 * @param {!WebInspector.SharedSidebarModel} sharedModel
 */
WebInspector.PlatformFontsWidget = function(sharedModel)
{
    WebInspector.ThrottledWidget.call(this);
    this.element.classList.add("platform-fonts");

    this._sharedModel = sharedModel;
    this._sharedModel.addEventListener(WebInspector.SharedSidebarModel.Events.ComputedStyleChanged, this.update, this);

    this._sectionTitle = createElementWithClass("div", "sidebar-separator");
    this.element.appendChild(this._sectionTitle);
    this._sectionTitle.textContent = WebInspector.UIString("Rendered Fonts");
    this._fontStatsSection = this.element.createChild("div", "stats-section");
}

/**
 * @param {!WebInspector.SharedSidebarModel} sharedModel
 * @return {!WebInspector.ElementsSidebarViewWrapperPane}
 */
WebInspector.PlatformFontsWidget.createSidebarWrapper = function(sharedModel)
{
    var widget = new WebInspector.PlatformFontsWidget(sharedModel);
    return new WebInspector.ElementsSidebarViewWrapperPane(WebInspector.UIString("Fonts"), widget)
}

WebInspector.PlatformFontsWidget.prototype = {
    /**
     * @override
     * @protected
     * @return {!Promise.<?>}
     */
    doUpdate: function()
    {
        var cssModel = this._sharedModel.cssModel();
        var node = this._sharedModel.node();
        if (!node || !cssModel)
            return Promise.resolve();

        return cssModel.platformFontsPromise(node.id)
            .then(this._refreshUI.bind(this, node))
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @param {?Array.<!CSSAgent.PlatformFontUsage>} platformFonts
     */
    _refreshUI: function(node, platformFonts)
    {
        if (this._sharedModel.node() !== node)
            return;

        this._fontStatsSection.removeChildren();

        var isEmptySection = !platformFonts || !platformFonts.length;
        this._sectionTitle.classList.toggle("hidden", isEmptySection);
        if (isEmptySection)
            return;

        platformFonts.sort(function (a, b) {
            return b.glyphCount - a.glyphCount;
        });
        for (var i = 0; i < platformFonts.length; ++i) {
            var fontStatElement = this._fontStatsSection.createChild("div", "font-stats-item");

            var fontNameElement = fontStatElement.createChild("span", "font-name");
            fontNameElement.textContent = platformFonts[i].familyName;

            var fontDelimeterElement = fontStatElement.createChild("span", "delimeter");
            fontDelimeterElement.textContent = "\u2014";

            var fontUsageElement = fontStatElement.createChild("span", "font-usage");
            var usage = platformFonts[i].glyphCount;
            fontUsageElement.textContent = usage === 1 ? WebInspector.UIString("%d glyph", usage) : WebInspector.UIString("%d glyphs", usage);
        }
    },

    __proto__: WebInspector.ThrottledWidget.prototype
}
;/* PropertiesWidget.js */
/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
 * Copyright (C) 2014 Google Inc. All rights reserved.
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
 * @extends {WebInspector.ThrottledWidget}
 */
WebInspector.PropertiesWidget = function()
{
    WebInspector.ThrottledWidget.call(this);

    WebInspector.targetManager.addModelListener(WebInspector.DOMModel, WebInspector.DOMModel.Events.AttrModified, this._onNodeChange, this);
    WebInspector.targetManager.addModelListener(WebInspector.DOMModel, WebInspector.DOMModel.Events.AttrRemoved, this._onNodeChange, this);
    WebInspector.targetManager.addModelListener(WebInspector.DOMModel, WebInspector.DOMModel.Events.CharacterDataModified, this._onNodeChange, this);
    WebInspector.targetManager.addModelListener(WebInspector.DOMModel, WebInspector.DOMModel.Events.ChildNodeCountUpdated, this._onNodeChange, this);
    WebInspector.context.addFlavorChangeListener(WebInspector.DOMNode, this._setNode, this);
}

/**
 * @return {!WebInspector.ElementsSidebarViewWrapperPane}
 */
WebInspector.PropertiesWidget.createSidebarWrapper = function()
{
    return new WebInspector.ElementsSidebarViewWrapperPane(WebInspector.UIString("Properties"), new WebInspector.PropertiesWidget());
}

WebInspector.PropertiesWidget._objectGroupName = "properties-sidebar-pane";

WebInspector.PropertiesWidget.prototype = {
    /**
     * @param {!WebInspector.Event} event
     */
    _setNode: function(event)
    {
        this._node = /** @type {?WebInspector.DOMNode} */(event.data);
        this.update();
    },

    /**
     * @override
     * @protected
     * @return {!Promise.<?>}
     */
    doUpdate: function()
    {
        if (this._lastRequestedNode) {
            this._lastRequestedNode.target().runtimeAgent().releaseObjectGroup(WebInspector.PropertiesWidget._objectGroupName);
            delete this._lastRequestedNode;
        }

        if (!this._node) {
            this.element.removeChildren();
            this.sections = [];
            return Promise.resolve();
        }

        this._lastRequestedNode = this._node;
        return this._node.resolveToObjectPromise(WebInspector.PropertiesWidget._objectGroupName)
            .then(nodeResolved.bind(this))

        /**
         * @param {?WebInspector.RemoteObject} object
         * @this {WebInspector.PropertiesWidget}
         */
        function nodeResolved(object)
        {
            if (!object)
                return;

            /**
             * @suppressReceiverCheck
             * @this {*}
             */
            function protoList()
            {
                var proto = this;
                var result = { __proto__: null };
                var counter = 1;
                while (proto) {
                    result[counter++] = proto;
                    proto = proto.__proto__;
                }
                return result;
            }
            var promise = object.callFunctionPromise(protoList).then(nodePrototypesReady.bind(this));
            object.release();
            return promise;
        }

        /**
         * @param {!{object: ?WebInspector.RemoteObject, wasThrown: (boolean|undefined)}} result
         * @this {WebInspector.PropertiesWidget}
         */
        function nodePrototypesReady(result)
        {
            if (!result.object || result.wasThrown)
                return;

            var promise = result.object.getOwnPropertiesPromise().then(fillSection.bind(this));
            result.object.release();
            return promise;
        }

        /**
         * @param {!{properties: ?Array.<!WebInspector.RemoteObjectProperty>, internalProperties: ?Array.<!WebInspector.RemoteObjectProperty>}} result
         * @this {WebInspector.PropertiesWidget}
         */
        function fillSection(result)
        {
            if (!result || !result.properties)
                return;

            var properties = result.properties;
            var expanded = [];
            var sections = this.sections || [];
            for (var i = 0; i < sections.length; ++i)
                expanded.push(sections[i].expanded);

            this.element.removeChildren();
            this.sections = [];

            // Get array of property user-friendly names.
            for (var i = 0; i < properties.length; ++i) {
                if (!parseInt(properties[i].name, 10))
                    continue;
                var property = properties[i].value;
                var title = property.description;
                title = title.replace(/Prototype$/, "");
                var section = new WebInspector.ObjectPropertiesSection(property, title);
                section.element.classList.add("properties-widget-section");
                this.sections.push(section);
                this.element.appendChild(section.element);
                if (expanded[this.sections.length - 1])
                    section.expand();
                section.addEventListener(TreeOutline.Events.ElementExpanded, this._propertyExpanded, this);
            }
        }
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _propertyExpanded: function(event)
    {
        WebInspector.userMetrics.actionTaken(WebInspector.UserMetrics.Action.DOMPropertiesExpanded);
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _onNodeChange: function(event)
    {
        if (!this._node)
            return;
        var data = event.data;
        var node = /** @type {!WebInspector.DOMNode} */ (data instanceof WebInspector.DOMNode ? data : data.node);
        if (this._node !== node)
            return;
        this.update();
    },

    __proto__: WebInspector.ThrottledWidget.prototype
}
;/* PropertyChangeHighlighter.js */
// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @constructor
 * @param {!WebInspector.StylesSidebarPane} ssp
 * @param {!WebInspector.CSSStyleModel} cssModel
 * @param {!CSSAgent.StyleSheetId} styleSheetId
 * @param {!WebInspector.TextRange} range
 */
WebInspector.PropertyChangeHighlighter = function(ssp, cssModel, styleSheetId, range)
{
    this._styleSidebarPane = ssp;
    this._target = cssModel.target();
    this._styleSheetId = styleSheetId;
    this._range = range;
}

WebInspector.PropertyChangeHighlighter.prototype = {
    /**
     */
    perform: function()
    {
        var node = this._styleSidebarPane.node();
        if (!node || this._target !== node.target())
            return;

        var foundSection = null;
        for (var section of this._styleSidebarPane.allSections()) {
            var declaration = section.style();
            if (declaration.styleSheetId !== this._styleSheetId)
                continue;

            var parentRule = declaration.parentRule;
            var isInlineSelector = this._range.isEmpty();
            var isMatchingRule = parentRule && parentRule.selectorRange() && this._range.compareTo(parentRule.selectorRange()) === 0;
            if (isInlineSelector || isMatchingRule) {
                section.element.animate([
                    { offset: 0, backgroundColor: "rgba(255, 227, 199, 1)" },
                    { offset: 0.5, backgroundColor: "rgba(255, 227, 199, 1)" },
                    { offset: 0.9, backgroundColor: "rgba(255, 227, 199, 0)" },
                    { offset: 1, backgroundColor: "white" }
                ], { duration : 400, easing: "cubic-bezier(0, 0, 0.2, 1)" });
                return;
            }

            if (this._checkRanges(declaration.range, this._range)) {
                foundSection = section;
                break;
            }
        }

        if (!foundSection)
            return;

        var highlightElement;
        var treeElement = foundSection.propertiesTreeOutline.firstChild();
        var foundTreeElement = null;
        while (!highlightElement && treeElement) {
            if (treeElement.property.range  && this._checkRanges(treeElement.property.range, this._range)) {
                highlightElement = treeElement.valueElement;
                break;
            }
            treeElement = treeElement.traverseNextTreeElement(false, null, true);
        }

        if (highlightElement) {
            highlightElement.animate([
                    { offset: 0, backgroundColor: "rgba(158, 54, 153, 1)", color: "white" },
                    { offset: 0.5, backgroundColor: "rgba(158, 54, 153, 1)", color: "white" },
                    { offset: 0.9, backgroundColor: "rgba(158, 54, 153, 0)", color: "initial" },
                    { offset: 1, backgroundColor: "white", color: "initial" }
                ], { duration : 400, easing: "cubic-bezier(0, 0, 0.2, 1)" });
        }
    },

    /**
     *
     * @param {!WebInspector.TextRange} outterRange
     * @param {!WebInspector.TextRange} innerRange
     * @return {boolean}
     */
    _checkRanges: function(outterRange, innerRange)
    {
        var startsBefore = outterRange.startLine < innerRange.startLine || (outterRange.startLine === innerRange.startLine && outterRange.startColumn <= innerRange.startColumn);
        // SSP might be outdated, so inner range will a bit bigger than outter. E.g.; "padding-left: 9px" -> "padding-left: 10px"
        var eps = 5;
        var endsAfter = outterRange.endLine > innerRange.endLine || (outterRange.endLine === innerRange.endLine && outterRange.endColumn + eps >= innerRange.endColumn);
        return startsBefore && endsAfter;
    }
}

/**
 * @constructor
 * @param {!WebInspector.StylesSidebarPane} ssp
 * @param {!WebInspector.CSSProperty} cssProperty
 */
WebInspector.PropertyRevealHighlighter = function(ssp, cssProperty)
{
    this._styleSidebarPane = ssp;
    this._cssProperty = cssProperty;
}

WebInspector.PropertyRevealHighlighter.prototype = {
    perform: function()
    {
        // Expand all shorthands.
        for (var section of this._styleSidebarPane.allSections()) {
            for (var treeElement = section.propertiesTreeOutline.firstChild(); treeElement; treeElement = treeElement.nextSibling)
                treeElement.onpopulate();
        }
        var highlightTreeElement = null;
        for (var section of this._styleSidebarPane.allSections()) {
            var treeElement = section.propertiesTreeOutline.firstChild();
            while (treeElement && !highlightTreeElement) {
                if (treeElement.property === this._cssProperty) {
                    highlightTreeElement = treeElement;
                    break;
                }
                treeElement = treeElement.traverseNextTreeElement(false, null, true);
            }
            if (highlightTreeElement)
                break;
        }

        if (!highlightTreeElement)
            return;

        highlightTreeElement.parent.expand();
        highlightTreeElement.listItemElement.scrollIntoViewIfNeeded();
        highlightTreeElement.listItemElement.animate([
                { offset: 0, backgroundColor: "rgba(255, 255, 0, 0.2)"},
                { offset: 0.1, backgroundColor: "rgba(255, 255, 0, 0.7)"},
                { offset: 1, backgroundColor: "transparent"}
            ], { duration : 2000, easing: "cubic-bezier(0, 0, 0.2, 1)" });
    },
}
;/* StylesSidebarPane.js */
/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
 * Copyright (C) 2009 Joseph Pecoraro
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
 * @extends {WebInspector.ElementsSidebarPane}
 */
WebInspector.StylesSidebarPane = function()
{
    WebInspector.ElementsSidebarPane.call(this, WebInspector.UIString("Styles"));
    this.setMinimumSize(96, 26);

    WebInspector.moduleSetting("colorFormat").addChangeListener(this.update.bind(this));
    WebInspector.moduleSetting("textEditorIndent").addChangeListener(this.update.bind(this));

    this._sectionsContainer = this.element.createChild("div");
    this._stylesPopoverHelper = new WebInspector.StylesPopoverHelper();
    this._linkifier = new WebInspector.Linkifier(new WebInspector.Linkifier.DefaultCSSFormatter());

    this.element.classList.add("styles-pane");
    this.element.addEventListener("mousemove", this._mouseMovedOverElement.bind(this), false);
    this._keyDownBound = this._keyDown.bind(this);
    this._keyUpBound = this._keyUp.bind(this);

    WebInspector.targetManager.addModelListener(WebInspector.CSSStyleModel, WebInspector.CSSStyleModel.Events.LayoutEditorChange, this._onLayoutEditorChange, this);
}

/**
 * @param {!WebInspector.CSSProperty} property
 * @return {!Element}
 */
WebInspector.StylesSidebarPane.createExclamationMark = function(property)
{
    var exclamationElement = createElement("label", "dt-icon-label");
    exclamationElement.className = "exclamation-mark";
    if (!WebInspector.StylesSidebarPane.ignoreErrorsForProperty(property))
        exclamationElement.type = "warning-icon";
    exclamationElement.title = WebInspector.CSSMetadata.cssPropertiesMetainfo.keySet()[property.name.toLowerCase()] ? WebInspector.UIString("Invalid property value") : WebInspector.UIString("Unknown property name");
    return exclamationElement;
}

/**
 * @param {!WebInspector.CSSProperty} property
 * @return {boolean}
 */
WebInspector.StylesSidebarPane.ignoreErrorsForProperty = function(property) {
    /**
     * @param {string} string
     */
    function hasUnknownVendorPrefix(string)
    {
        return !string.startsWith("-webkit-") && /^[-_][\w\d]+-\w/.test(string);
    }

    var name = property.name.toLowerCase();

    // IE hack.
    if (name.charAt(0) === "_")
        return true;

    // IE has a different format for this.
    if (name === "filter")
        return true;

    // Common IE-specific property prefix.
    if (name.startsWith("scrollbar-"))
        return true;
    if (hasUnknownVendorPrefix(name))
        return true;

    var value = property.value.toLowerCase();

    // IE hack.
    if (value.endsWith("\9"))
        return true;
    if (hasUnknownVendorPrefix(value))
        return true;

    return false;
}

WebInspector.StylesSidebarPane.prototype = {
    /**
     * @param {!WebInspector.Event} event
     */
    _onLayoutEditorChange: function(event)
    {
        var cssModel = /** @type {!WebInspector.CSSStyleModel} */(event.target);
        var styleSheetId = event.data["id"];
        var sourceRange = /** @type {!CSSAgent.SourceRange} */(event.data["range"]);
        var range = WebInspector.TextRange.fromObject(sourceRange);
        this._decorator = new WebInspector.PropertyChangeHighlighter(this, cssModel, styleSheetId, range);
        this.update();
    },

    /**
     * @param {!WebInspector.CSSProperty} cssProperty
     */
    revealProperty: function(cssProperty)
    {
        this._decorator = new WebInspector.PropertyRevealHighlighter(this, cssProperty);
        this._decorator.perform();
        this.update();
    },

    onUndoOrRedoHappened: function()
    {
        this.setNode(this.node());
    },

    /**
     * @param {!Event} event
     */
    _onAddButtonLongClick: function(event)
    {
        var cssModel = this.cssModel();
        if (!cssModel)
            return;
        var headers = cssModel.styleSheetHeaders().filter(styleSheetResourceHeader);

        /** @type {!Array.<{text: string, handler: function()}>} */
        var contextMenuDescriptors = [];
        for (var i = 0; i < headers.length; ++i) {
            var header = headers[i];
            var handler = this._createNewRuleInStyleSheet.bind(this, header);
            contextMenuDescriptors.push({
                text: WebInspector.displayNameForURL(header.resourceURL()),
                handler: handler
            });
        }

        contextMenuDescriptors.sort(compareDescriptors);

        var contextMenu = new WebInspector.ContextMenu(event);
        for (var i = 0; i < contextMenuDescriptors.length; ++i) {
            var descriptor = contextMenuDescriptors[i];
            contextMenu.appendItem(descriptor.text, descriptor.handler);
        }
        if (!contextMenu.isEmpty())
            contextMenu.appendSeparator();
        contextMenu.appendItem("inspector-stylesheet", this._createNewRuleInViaInspectorStyleSheet.bind(this));
        contextMenu.show();

        /**
         * @param {!{text: string, handler: function()}} descriptor1
         * @param {!{text: string, handler: function()}} descriptor2
         * @return {number}
         */
        function compareDescriptors(descriptor1, descriptor2)
        {
            return String.naturalOrderComparator(descriptor1.text, descriptor2.text);
        }

        /**
         * @param {!WebInspector.CSSStyleSheetHeader} header
         * @return {boolean}
         */
        function styleSheetResourceHeader(header)
        {
            return !header.isViaInspector() && !header.isInline && !!header.resourceURL();
        }
    },

    /**
     * @param {!WebInspector.CSSRule} editedRule
     * @param {!WebInspector.TextRange} oldRange
     * @param {!WebInspector.TextRange} newRange
     */
    _styleSheetRuleEdited: function(editedRule, oldRange, newRange)
    {
        if (!editedRule.styleSheetId)
            return;
        for (var section of this.allSections())
            section._styleSheetRuleEdited(editedRule, oldRange, newRange);
    },

    /**
     * @param {!WebInspector.CSSMedia} oldMedia
     * @param {!WebInspector.CSSMedia}  newMedia
     */
    _styleSheetMediaEdited: function(oldMedia, newMedia)
    {
        if (!oldMedia.parentStyleSheetId)
            return;
        for (var section of this.allSections())
            section._styleSheetMediaEdited(oldMedia, newMedia);
    },

    /**
     * @param {?RegExp} regex
     */
    onFilterChanged: function(regex)
    {
        this._filterRegex = regex;
        this._updateFilter();
    },

    /**
     * @override
     * @param {?WebInspector.DOMNode} node
     */
    setNode: function(node)
    {
        this._stylesPopoverHelper.hide();
        node = WebInspector.SharedSidebarModel.elementNode(node);

        this._resetCache();
        WebInspector.ElementsSidebarPane.prototype.setNode.call(this, node);
    },

    /**
     * @param {!WebInspector.StylePropertiesSection=} editedSection
     */
    _refreshUpdate: function(editedSection)
    {
        var node = this.node();
        if (!node)
            return;

        for (var section of this.allSections()) {
            if (section.isBlank)
                continue;
            section.update(section === editedSection);
        }

        if (this._filterRegex)
            this._updateFilter();
        this._nodeStylesUpdatedForTest(node, false);
    },

    /**
     * @override
     * @return {!Promise.<?>}
     */
    doUpdate: function()
    {
        this._discardElementUnderMouse();

        return this.fetchMatchedCascade()
            .then(this._innerRebuildUpdate.bind(this));
    },

    _resetCache: function()
    {
        delete this._matchedCascadePromise;
    },

    /**
     * @return {!Promise.<?WebInspector.CSSStyleModel.MatchedStyleResult>}
     */
    fetchMatchedCascade: function()
    {
        var node = this.node();
        if (!node)
            return Promise.resolve(/** @type {?WebInspector.CSSStyleModel.MatchedStyleResult} */(null));
        if (!this._matchedCascadePromise)
            this._matchedCascadePromise = this._matchedStylesForNode(node).then(validateStyles.bind(this));
        return this._matchedCascadePromise;

        /**
         * @param {?WebInspector.CSSStyleModel.MatchedStyleResult} matchedStyles
         * @return {?WebInspector.CSSStyleModel.MatchedStyleResult}
         * @this {WebInspector.StylesSidebarPane}
         */
        function validateStyles(matchedStyles)
        {
            return matchedStyles && matchedStyles.node() === this.node() ? matchedStyles : null;
        }
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @return {!Promise.<?WebInspector.CSSStyleModel.MatchedStyleResult>}
     */
    _matchedStylesForNode: function(node)
    {
        var cssModel = this.cssModel();
        if (!cssModel)
            return Promise.resolve(/** @type {?WebInspector.CSSStyleModel.MatchedStyleResult} */(null));
        return cssModel.matchedStylesPromise(node.id)
    },

    /**
     * @param {boolean} editing
     */
    setEditingStyle: function(editing)
    {
        if (this._isEditingStyle === editing)
            return;
        this.element.classList.toggle("is-editing-style", editing);
        this._isEditingStyle = editing;
    },

    /**
     * @override
     */
    onCSSModelChanged: function()
    {
        if (this._userOperation || this._isEditingStyle)
            return;

        this._resetCache();
        this.update();
    },

    /**
     * @override
     */
    onFrameResizedThrottled: function()
    {
        this.onCSSModelChanged();
    },

    /**
     * @override
     * @param {!WebInspector.DOMNode} node
     */
    onDOMModelChanged: function(node)
    {
        // Any attribute removal or modification can affect the styles of "related" nodes.
        // Do not touch the styles if they are being edited.
        if (this._isEditingStyle || this._userOperation)
            return;

        if (!this._canAffectCurrentStyles(node))
            return;

        this._resetCache();
        this.update();
    },

    /**
     * @param {?WebInspector.DOMNode} node
     */
    _canAffectCurrentStyles: function(node)
    {
        var currentNode = this.node();
        return currentNode && (currentNode === node || node.parentNode === currentNode.parentNode || node.isAncestor(currentNode));
    },

    /**
     * @param {?WebInspector.CSSStyleModel.MatchedStyleResult} matchedStyles
     */
    _innerRebuildUpdate: function(matchedStyles)
    {
        this._linkifier.reset();
        this._sectionsContainer.removeChildren();
        this._sectionBlocks = [];

        var node = this.node();
        if (!matchedStyles || !node)
            return;

        this._sectionBlocks = this._rebuildSectionsForMatchedStyleRules(matchedStyles);
        var pseudoTypes = [];
        var keys = new Set(matchedStyles.pseudoStyles().keys());
        if (keys.delete(DOMAgent.PseudoType.Before))
            pseudoTypes.push(DOMAgent.PseudoType.Before);
        pseudoTypes = pseudoTypes.concat(keys.valuesArray().sort());
        for (var pseudoType of pseudoTypes) {
            var block = WebInspector.SectionBlock.createPseudoTypeBlock(pseudoType);
            var styles = /** @type {!Array<!WebInspector.CSSStyleDeclaration>} */(matchedStyles.pseudoStyles().get(pseudoType));
            for (var style of styles) {
                var section = new WebInspector.StylePropertiesSection(this, matchedStyles, style);
                block.sections.push(section);
            }
            this._sectionBlocks.push(block);
        }

        for (var keyframesRule of matchedStyles.keyframes()) {
            var block = WebInspector.SectionBlock.createKeyframesBlock(keyframesRule.name().text);
            for (var keyframe of keyframesRule.keyframes())
                block.sections.push(new WebInspector.KeyframePropertiesSection(this, matchedStyles, keyframe.style));
            this._sectionBlocks.push(block);
        }

        for (var block of this._sectionBlocks) {
            var titleElement = block.titleElement();
            if (titleElement)
                this._sectionsContainer.appendChild(titleElement);
            for (var section of block.sections)
                this._sectionsContainer.appendChild(section.element);
        }

        if (this._filterRegex)
            this._updateFilter();

        this._nodeStylesUpdatedForTest(node, true);
        if (this._decorator) {
            this._decorator.perform();
            delete this._decorator;
        }
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @param {boolean} rebuild
     */
    _nodeStylesUpdatedForTest: function(node, rebuild)
    {
        // For sniffing in tests.
    },

    /**
     * @param {!WebInspector.CSSStyleModel.MatchedStyleResult} matchedStyles
     * @return {!Array.<!WebInspector.SectionBlock>}
     */
    _rebuildSectionsForMatchedStyleRules: function(matchedStyles)
    {
        var blocks = [new WebInspector.SectionBlock(null)];
        var lastParentNode = null;
        for (var style of matchedStyles.nodeStyles()) {
            var parentNode = matchedStyles.isInherited(style) ? matchedStyles.nodeForStyle(style) : null;
            if (parentNode && parentNode !== lastParentNode) {
                lastParentNode = parentNode;
                var block = WebInspector.SectionBlock.createInheritedNodeBlock(lastParentNode);
                blocks.push(block);
            }

            var section = new WebInspector.StylePropertiesSection(this, matchedStyles, style);
            blocks.peekLast().sections.push(section);
        }
        return blocks;
    },

    _createNewRuleInViaInspectorStyleSheet: function()
    {
        var cssModel = this.cssModel();
        var node = this.node();
        if (!cssModel || !node)
            return;
        this._userOperation = true;
        cssModel.requestViaInspectorStylesheet(node, onViaInspectorStyleSheet.bind(this));

        /**
         * @param {?WebInspector.CSSStyleSheetHeader} styleSheetHeader
         * @this {WebInspector.StylesSidebarPane}
         */
        function onViaInspectorStyleSheet(styleSheetHeader)
        {
            delete this._userOperation;
            this._createNewRuleInStyleSheet(styleSheetHeader);
        }
    },

    /**
     * @param {?WebInspector.CSSStyleSheetHeader} styleSheetHeader
     */
    _createNewRuleInStyleSheet: function(styleSheetHeader)
    {
        if (!styleSheetHeader)
            return;
        styleSheetHeader.requestContent().then(onStyleSheetContent.bind(this, styleSheetHeader.id));

        /**
         * @param {string} styleSheetId
         * @param {?string} text
         * @this {WebInspector.StylesSidebarPane}
         */
        function onStyleSheetContent(styleSheetId, text)
        {
            text = text || "";
            var lines = text.split("\n");
            var range = WebInspector.TextRange.createFromLocation(lines.length - 1, lines[lines.length - 1].length);
            this._addBlankSection(this._sectionBlocks[0].sections[0], styleSheetId, range);
        }
    },

    /**
     * @param {!WebInspector.StylePropertiesSection} insertAfterSection
     * @param {string} styleSheetId
     * @param {!WebInspector.TextRange} ruleLocation
     */
    _addBlankSection: function(insertAfterSection, styleSheetId, ruleLocation)
    {
        this.expand();
        var node = this.node();
        var blankSection = new WebInspector.BlankStylePropertiesSection(this, insertAfterSection._matchedStyles, node ? WebInspector.DOMPresentationUtils.simpleSelector(node) : "", styleSheetId, ruleLocation, insertAfterSection._style);

        this._sectionsContainer.insertBefore(blankSection.element, insertAfterSection.element.nextSibling);

        for (var block of this._sectionBlocks) {
            var index = block.sections.indexOf(insertAfterSection);
            if (index === -1)
                continue;
            block.sections.splice(index + 1, 0, blankSection);
            blankSection.startEditingSelector();
        }
    },

    /**
     * @param {!WebInspector.StylePropertiesSection} section
     */
    removeSection: function(section)
    {
        for (var block of this._sectionBlocks) {
            var index = block.sections.indexOf(section);
            if (index === -1)
                continue;
            block.sections.splice(index, 1);
            section.element.remove();
        }
    },

    /**
     * @return {?RegExp}
     */
    filterRegex: function()
    {
        return this._filterRegex;
    },

    _updateFilter: function()
    {
        for (var block of this._sectionBlocks)
            block.updateFilter();
    },

    /**
     * @override
     */
    wasShown: function()
    {
        WebInspector.ElementsSidebarPane.prototype.wasShown.call(this);
        this.element.ownerDocument.body.addEventListener("keydown", this._keyDownBound, false);
        this.element.ownerDocument.body.addEventListener("keyup", this._keyUpBound, false);
    },

    /**
     * @override
     */
    willHide: function()
    {
        this.element.ownerDocument.body.removeEventListener("keydown", this._keyDownBound, false);
        this.element.ownerDocument.body.removeEventListener("keyup", this._keyUpBound, false);
        this._stylesPopoverHelper.hide();
        this._discardElementUnderMouse();
        WebInspector.ElementsSidebarPane.prototype.willHide.call(this);
    },

    _discardElementUnderMouse: function()
    {
        if (this._elementUnderMouse)
            this._elementUnderMouse.classList.remove("styles-panel-hovered");
        delete this._elementUnderMouse;
    },

    /**
     * @param {!Event} event
     */
    _mouseMovedOverElement: function(event)
    {
        if (this._elementUnderMouse && event.target !== this._elementUnderMouse)
            this._discardElementUnderMouse();
        this._elementUnderMouse = event.target;
        if (WebInspector.KeyboardShortcut.eventHasCtrlOrMeta(/** @type {!MouseEvent} */(event)))
            this._elementUnderMouse.classList.add("styles-panel-hovered");
    },

    /**
     * @param {!Event} event
     */
    _keyDown: function(event)
    {
        if ((!WebInspector.isMac() && event.keyCode === WebInspector.KeyboardShortcut.Keys.Ctrl.code) ||
            (WebInspector.isMac() && event.keyCode === WebInspector.KeyboardShortcut.Keys.Meta.code)) {
            if (this._elementUnderMouse)
                this._elementUnderMouse.classList.add("styles-panel-hovered");
        }
    },

    /**
     * @param {!Event} event
     */
    _keyUp: function(event)
    {
        if ((!WebInspector.isMac() && event.keyCode === WebInspector.KeyboardShortcut.Keys.Ctrl.code) ||
            (WebInspector.isMac() && event.keyCode === WebInspector.KeyboardShortcut.Keys.Meta.code)) {
            this._discardElementUnderMouse();
        }
    },

    /**
     * @return {!Array<!WebInspector.StylePropertiesSection>}
     */
    allSections: function()
    {
        var sections = [];
        for (var block of this._sectionBlocks)
            sections = sections.concat(block.sections);
        return sections;
    },

    __proto__: WebInspector.ElementsSidebarPane.prototype
}

/**
 * @param {string} placeholder
 * @param {!Element} container
 * @param {function(?RegExp)} filterCallback
 * @return {!Element}
 */
WebInspector.StylesSidebarPane.createPropertyFilterElement = function(placeholder, container, filterCallback)
{
    var input = createElement("input");
    input.placeholder = placeholder;

    function searchHandler()
    {
        var regex = input.value ? new RegExp(input.value.escapeForRegExp(), "i") : null;
        filterCallback(regex);
        container.classList.toggle("styles-filter-engaged", !!input.value);
    }
    input.addEventListener("input", searchHandler, false);

    /**
     * @param {!Event} event
     */
    function keydownHandler(event)
    {
        var Esc = "U+001B";
        if (event.keyIdentifier !== Esc || !input.value)
            return;
        event.consume(true);
        input.value = "";
        searchHandler();
    }
    input.addEventListener("keydown", keydownHandler, false);

    input.setFilterValue = setFilterValue;

    /**
     * @param {string} value
     */
    function setFilterValue(value)
    {
        input.value = value;
        input.focus();
        searchHandler();
    }

    return input;
}

/**
 * @constructor
 * @param {?Element} titleElement
 */
WebInspector.SectionBlock = function(titleElement)
{
    this._titleElement = titleElement;
    this.sections = [];
}

/**
 * @param {!DOMAgent.PseudoType} pseudoType
 * @return {!WebInspector.SectionBlock}
 */
WebInspector.SectionBlock.createPseudoTypeBlock = function(pseudoType)
{
    var separatorElement = createElement("div");
    separatorElement.className = "sidebar-separator";
    separatorElement.textContent = WebInspector.UIString("Pseudo ::%s element", pseudoType);
    return new WebInspector.SectionBlock(separatorElement);
}

/**
 * @param {string} keyframesName
 * @return {!WebInspector.SectionBlock}
 */
WebInspector.SectionBlock.createKeyframesBlock = function(keyframesName)
{
    var separatorElement = createElement("div");
    separatorElement.className = "sidebar-separator";
    separatorElement.textContent = WebInspector.UIString("@keyframes " + keyframesName);
    return new WebInspector.SectionBlock(separatorElement);
}

/**
 * @param {!WebInspector.DOMNode} node
 * @return {!WebInspector.SectionBlock}
 */
WebInspector.SectionBlock.createInheritedNodeBlock = function(node)
{
    var separatorElement = createElement("div");
    separatorElement.className = "sidebar-separator";
    var link = WebInspector.DOMPresentationUtils.linkifyNodeReference(node);
    separatorElement.createTextChild(WebInspector.UIString("Inherited from") + " ");
    separatorElement.appendChild(link);
    return new WebInspector.SectionBlock(separatorElement);
}

WebInspector.SectionBlock.prototype = {
    updateFilter: function()
    {
        var hasAnyVisibleSection = false;
        for (var section of this.sections)
            hasAnyVisibleSection |= section._updateFilter();
        if (this._titleElement)
            this._titleElement.classList.toggle("hidden", !hasAnyVisibleSection);
    },

    /**
     * @return {?Element}
     */
    titleElement: function()
    {
        return this._titleElement;
    }
}

/**
 * @constructor
 * @param {!WebInspector.StylesSidebarPane} parentPane
 * @param {!WebInspector.CSSStyleModel.MatchedStyleResult} matchedStyles
 * @param {!WebInspector.CSSStyleDeclaration} style
 */
WebInspector.StylePropertiesSection = function(parentPane, matchedStyles, style)
{
    this._parentPane = parentPane;
    this._style = style;
    this._matchedStyles = matchedStyles;
    this.editable = !!(style.styleSheetId && style.range);

    var rule = style.parentRule;
    this.element = createElementWithClass("div", "styles-section matched-styles monospace");
    this.element._section = this;

    this._titleElement = this.element.createChild("div", "styles-section-title " + (rule ? "styles-selector" : ""));

    this.propertiesTreeOutline = new TreeOutline();
    this.propertiesTreeOutline.element.classList.add("style-properties", "monospace");
    this.propertiesTreeOutline.section = this;
    this.element.appendChild(this.propertiesTreeOutline.element);

    var selectorContainer = createElement("div");
    this._selectorElement = createElementWithClass("span", "selector");
    this._selectorElement.textContent = this._headerText();
    selectorContainer.appendChild(this._selectorElement);
    this._selectorElement.addEventListener("mouseenter", this._onMouseEnterSelector.bind(this), false);
    this._selectorElement.addEventListener("mouseleave", this._onMouseOutSelector.bind(this), false);

    var openBrace = createElement("span");
    openBrace.textContent = " {";
    selectorContainer.appendChild(openBrace);
    selectorContainer.addEventListener("mousedown", this._handleEmptySpaceMouseDown.bind(this), false);
    selectorContainer.addEventListener("click", this._handleSelectorContainerClick.bind(this), false);

    var closeBrace = this.element.createChild("div", "sidebar-pane-closing-brace");
    closeBrace.textContent = "}";

    if (this.editable) {
        var items = [];
        var colorButton = new WebInspector.ToolbarButton(WebInspector.UIString("Add color"), "foreground-color-toolbar-item");
        colorButton.addEventListener("click", this._onInsertColorPropertyClick.bind(this));
        items.push(colorButton);

        var backgroundButton = new WebInspector.ToolbarButton(WebInspector.UIString("Add background-color"), "background-color-toolbar-item");
        backgroundButton.addEventListener("click", this._onInsertBackgroundColorPropertyClick.bind(this));
        items.push(backgroundButton);

        if (rule) {
            var newRuleButton = new WebInspector.ToolbarButton(WebInspector.UIString("Insert Style Rule"), "add-toolbar-item");
            newRuleButton.addEventListener("click", this._onNewRuleClick.bind(this));
            items.push(newRuleButton);
        }

        var menuButton = new WebInspector.ToolbarButton(WebInspector.UIString("More tools\u2026"), "menu-toolbar-item");
        items.push(menuButton);

        if (items.length) {
            var sectionToolbar = new WebInspector.Toolbar("sidebar-pane-section-toolbar", closeBrace);

            for (var i = 0; i < items.length; ++i)
                sectionToolbar.appendToolbarItem(items[i]);

            items.pop();

            /**
             * @param {!Array<!WebInspector.ToolbarButton>} items
             * @param {boolean} value
             */
            function setItemsVisibility(items, value)
            {
                for (var i = 0; i < items.length; ++i)
                    items[i].setVisible(value);
                menuButton.setVisible(!value);
            }
            setItemsVisibility(items, false);
            sectionToolbar.element.addEventListener("mouseenter", setItemsVisibility.bind(null, items, true));
            sectionToolbar.element.addEventListener("mouseleave", setItemsVisibility.bind(null, items, false));
        }
    }

    this._selectorElement.addEventListener("click", this._handleSelectorClick.bind(this), false);
    this.element.addEventListener("mousedown", this._handleEmptySpaceMouseDown.bind(this), false);
    this.element.addEventListener("click", this._handleEmptySpaceClick.bind(this), false);

    if (rule) {
        // Prevent editing the user agent and user rules.
        if (rule.isUserAgent() || rule.isInjected()) {
            this.editable = false;
        } else {
            // Check this is a real CSSRule, not a bogus object coming from WebInspector.BlankStylePropertiesSection.
            if (rule.styleSheetId)
                this.navigable = !!rule.resourceURL();
        }
    }

    this._mediaListElement = this._titleElement.createChild("div", "media-list media-matches");
    this._selectorRefElement = this._titleElement.createChild("div", "styles-section-subtitle");
    this._updateMediaList();
    this._updateRuleOrigin();
    this._titleElement.appendChild(selectorContainer);
    this._selectorContainer = selectorContainer;

    if (this.navigable)
        this.element.classList.add("navigable");

    if (!this.editable)
        this.element.classList.add("read-only");

    this._markSelectorMatches();
    this.onpopulate();
}

WebInspector.StylePropertiesSection.prototype = {
    /**
     * @return {!WebInspector.CSSStyleDeclaration}
     */
    style: function()
    {
        return this._style;
    },

    /**
     * @return {string}
     */
    _headerText: function()
    {
        var node = this._matchedStyles.nodeForStyle(this._style);
        if (this._style.type === WebInspector.CSSStyleDeclaration.Type.Inline)
            return this._matchedStyles.isInherited(this._style) ? WebInspector.UIString("Style Attribute") : "element.style";
        if (this._style.type === WebInspector.CSSStyleDeclaration.Type.Attributes)
            return node.nodeNameInCorrectCase() + "[" + WebInspector.UIString("Attributes Style") + "]";
        return this._style.parentRule.selectorText();
    },

    _onMouseOutSelector: function()
    {
        if (this._hoverTimer)
            clearTimeout(this._hoverTimer);
        WebInspector.DOMModel.hideDOMNodeHighlight()
    },

    _onMouseEnterSelector: function()
    {
        if (this._hoverTimer)
            clearTimeout(this._hoverTimer);
        this._hoverTimer = setTimeout(this._highlight.bind(this), 300);
    },

    _highlight: function()
    {
        WebInspector.DOMModel.hideDOMNodeHighlight();
        var node = this._parentPane.node();
        var domModel = node.domModel();
        var selectors = this._style.parentRule ? this._style.parentRule.selectorText() : undefined;
        domModel.highlightDOMNodeWithConfig(node.id, { mode: "all", showInfo: undefined, selectors: selectors });
    },

    /**
     * @return {?WebInspector.StylePropertiesSection}
     */
    firstSibling: function()
    {
        var parent = this.element.parentElement;
        if (!parent)
            return null;

        var childElement = parent.firstChild;
        while (childElement) {
            if (childElement._section)
                return childElement._section;
            childElement = childElement.nextSibling;
        }

        return null;
    },

    /**
     * @return {?WebInspector.StylePropertiesSection}
     */
    lastSibling: function()
    {
        var parent = this.element.parentElement;
        if (!parent)
            return null;

        var childElement = parent.lastChild;
        while (childElement) {
            if (childElement._section)
                return childElement._section;
            childElement = childElement.previousSibling;
        }

        return null;
    },

    /**
     * @return {?WebInspector.StylePropertiesSection}
     */
    nextSibling: function()
    {
        var curElement = this.element;
        do {
            curElement = curElement.nextSibling;
        } while (curElement && !curElement._section);

        return curElement ? curElement._section : null;
    },

    /**
     * @return {?WebInspector.StylePropertiesSection}
     */
    previousSibling: function()
    {
        var curElement = this.element;
        do {
            curElement = curElement.previousSibling;
        } while (curElement && !curElement._section);

        return curElement ? curElement._section : null;
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _onNewRuleClick: function(event)
    {
        event.consume();
        var rule = this._style.parentRule;
        var range = WebInspector.TextRange.createFromLocation(rule.style.range.endLine, rule.style.range.endColumn + 1);
        this._parentPane._addBlankSection(this, /** @type {string} */(rule.styleSheetId), range);
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _onInsertColorPropertyClick: function(event)
    {
        event.consume(true);
        var treeElement = this.addNewBlankProperty();
        treeElement.property.name = "color";
        treeElement.property.value = "black";
        treeElement.updateTitle();
        var colorSwatch = WebInspector.ColorSwatchPopoverIcon.forTreeElement(treeElement);
        if (colorSwatch)
            colorSwatch.showPopover();
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _onInsertBackgroundColorPropertyClick: function(event)
    {
        event.consume(true);
        var treeElement = this.addNewBlankProperty();
        treeElement.property.name = "background-color";
        treeElement.property.value = "white";
        treeElement.updateTitle();
        var colorSwatch = WebInspector.ColorSwatchPopoverIcon.forTreeElement(treeElement);
        if (colorSwatch)
            colorSwatch.showPopover();
    },

    /**
     * @param {!WebInspector.CSSRule} editedRule
     * @param {!WebInspector.TextRange} oldRange
     * @param {!WebInspector.TextRange} newRange
     */
    _styleSheetRuleEdited: function(editedRule, oldRange, newRange)
    {
        var rule = this._style.parentRule;
        if (!rule || !rule.styleSheetId)
            return;
        if (rule !== editedRule)
            rule.sourceStyleSheetEdited(/** @type {string} */(editedRule.styleSheetId), oldRange, newRange);
        this._updateMediaList();
        this._updateRuleOrigin();
    },

    /**
     * @param {!WebInspector.CSSMedia} oldMedia
     * @param {!WebInspector.CSSMedia} newMedia
     */
    _styleSheetMediaEdited: function(oldMedia, newMedia)
    {
        var rule = this._style.parentRule;
        if (!rule || !rule.styleSheetId)
            return;
        rule.mediaEdited(oldMedia, newMedia);
        this._updateMediaList();
    },

    /**
     * @param {?Array.<!WebInspector.CSSMedia>} mediaRules
     */
    _createMediaList: function(mediaRules)
    {
        if (!mediaRules)
            return;
        for (var i = mediaRules.length - 1; i >= 0; --i) {
            var media = mediaRules[i];
            // Don't display trivial non-print media types.
            if (!media.text.includes("(") && media.text !== "print")
                continue;
            var mediaDataElement = this._mediaListElement.createChild("div", "media");
            var mediaContainerElement = mediaDataElement.createChild("span");
            var mediaTextElement = mediaContainerElement.createChild("span", "media-text");
            switch (media.source) {
            case WebInspector.CSSMedia.Source.LINKED_SHEET:
            case WebInspector.CSSMedia.Source.INLINE_SHEET:
                mediaTextElement.textContent = "media=\"" + media.text + "\"";
                break;
            case WebInspector.CSSMedia.Source.MEDIA_RULE:
                var decoration = mediaContainerElement.createChild("span");
                mediaContainerElement.insertBefore(decoration, mediaTextElement);
                decoration.textContent = "@media ";
                mediaTextElement.textContent = media.text;
                if (media.parentStyleSheetId) {
                    mediaDataElement.classList.add("editable-media");
                    mediaTextElement.addEventListener("click", this._handleMediaRuleClick.bind(this, media, mediaTextElement), false);
                }
                break;
            case WebInspector.CSSMedia.Source.IMPORT_RULE:
                mediaTextElement.textContent = "@import " + media.text;
                break;
            }
        }
    },

    _updateMediaList: function()
    {
        this._mediaListElement.removeChildren();
        this._createMediaList(this._style.parentRule ? this._style.parentRule.media : null);
    },

    /**
     * @param {string} propertyName
     * @return {boolean}
     */
    isPropertyInherited: function(propertyName)
    {
        if (this._matchedStyles.isInherited(this._style)) {
            // While rendering inherited stylesheet, reverse meaning of this property.
            // Render truly inherited properties with black, i.e. return them as non-inherited.
            return !WebInspector.CSSMetadata.isPropertyInherited(propertyName);
        }
        return false;
    },

    /**
     * @return {?WebInspector.StylePropertiesSection}
     */
    nextEditableSibling: function()
    {
        var curSection = this;
        do {
            curSection = curSection.nextSibling();
        } while (curSection && !curSection.editable);

        if (!curSection) {
            curSection = this.firstSibling();
            while (curSection && !curSection.editable)
                curSection = curSection.nextSibling();
        }

        return (curSection && curSection.editable) ? curSection : null;
    },

    /**
     * @return {?WebInspector.StylePropertiesSection}
     */
    previousEditableSibling: function()
    {
        var curSection = this;
        do {
            curSection = curSection.previousSibling();
        } while (curSection && !curSection.editable);

        if (!curSection) {
            curSection = this.lastSibling();
            while (curSection && !curSection.editable)
                curSection = curSection.previousSibling();
        }

        return (curSection && curSection.editable) ? curSection : null;
    },

    /**
     * @param {boolean} full
     */
    update: function(full)
    {
        this._selectorElement.textContent = this._headerText();
        this._markSelectorMatches();
        if (full) {
            this.propertiesTreeOutline.removeChildren();
            this.onpopulate();
        } else {
            var child = this.propertiesTreeOutline.firstChild();
            while (child) {
                child.setOverloaded(this._isPropertyOverloaded(child.property));
                child = child.traverseNextTreeElement(false, null, true);
            }
        }
        this.afterUpdate();
    },

    afterUpdate: function()
    {
        if (this._afterUpdate) {
            this._afterUpdate(this);
            delete this._afterUpdate;
            this._afterUpdateFinishedForTest();
        }
    },

    _afterUpdateFinishedForTest: function()
    {
    },

    onpopulate: function()
    {
        var style = this._style;
        for (var property of style.leadingProperties()) {
            var isShorthand = !!style.longhandProperties(property.name).length;
            var inherited = this.isPropertyInherited(property.name);
            var overloaded = this._isPropertyOverloaded(property);
            var item = new WebInspector.StylePropertyTreeElement(this._parentPane, this._matchedStyles, property, isShorthand, inherited, overloaded);
            this.propertiesTreeOutline.appendChild(item);
        }
    },

    /**
     * @param {!WebInspector.CSSProperty} property
     * @return {boolean}
     */
    _isPropertyOverloaded: function(property)
    {
        return this._matchedStyles.propertyState(property) === WebInspector.CSSStyleModel.MatchedStyleResult.PropertyState.Overloaded;
    },

    /**
     * @return {boolean}
     */
    _updateFilter: function()
    {
        var hasMatchingChild = false;
        for (var child of this.propertiesTreeOutline.rootElement().children())
            hasMatchingChild |= child._updateFilter();

        var regex = this._parentPane.filterRegex();
        var hideRule = !hasMatchingChild && regex && !regex.test(this.element.textContent);
        this.element.classList.toggle("hidden", hideRule);
        if (!hideRule && this._style.parentRule)
            this._markSelectorHighlights();
        return !hideRule;
    },

    _markSelectorMatches: function()
    {
        var rule = this._style.parentRule;
        if (!rule)
            return;

        this._mediaListElement.classList.toggle("media-matches", this._matchedStyles.mediaMatches(this._style));

        if (!this._matchedStyles.hasMatchingSelectors(this._style))
            return;

        var selectors = rule.selectors;
        var fragment = createDocumentFragment();
        var currentMatch = 0;
        var matchingSelectors = rule.matchingSelectors;
        for (var i = 0; i < selectors.length ; ++i) {
            if (i)
                fragment.createTextChild(", ");
            var isSelectorMatching = matchingSelectors[currentMatch] === i;
            if (isSelectorMatching)
                ++currentMatch;
            var matchingSelectorClass = isSelectorMatching ? " selector-matches" : "";
            var selectorElement = createElement("span");
            selectorElement.className = "simple-selector" + matchingSelectorClass;
            if (rule.styleSheetId)
                selectorElement._selectorIndex = i;
            selectorElement.textContent = selectors[i].text;

            fragment.appendChild(selectorElement);
        }

        this._selectorElement.removeChildren();
        this._selectorElement.appendChild(fragment);
        this._markSelectorHighlights();
    },

    _markSelectorHighlights: function()
    {
        var selectors = this._selectorElement.getElementsByClassName("simple-selector");
        var regex = this._parentPane.filterRegex();
        for (var i = 0; i < selectors.length; ++i) {
            var selectorMatchesFilter = !!regex && regex.test(selectors[i].textContent);
            selectors[i].classList.toggle("filter-match", selectorMatchesFilter);
        }
    },

    /**
     * @return {boolean}
     */
    _checkWillCancelEditing: function()
    {
        var willCauseCancelEditing = this._willCauseCancelEditing;
        delete this._willCauseCancelEditing;
        return willCauseCancelEditing;
    },

    /**
     * @param {!Event} event
     */
    _handleSelectorContainerClick: function(event)
    {
        if (this._checkWillCancelEditing() || !this.editable)
            return;
        if (event.target === this._selectorContainer) {
            this.addNewBlankProperty(0).startEditing();
            event.consume(true);
        }
    },

    /**
     * @param {number=} index
     * @return {!WebInspector.StylePropertyTreeElement}
     */
    addNewBlankProperty: function(index)
    {
        var property = this._style.newBlankProperty(index);
        var item = new WebInspector.StylePropertyTreeElement(this._parentPane, this._matchedStyles, property, false, false, false);
        index = property.index;
        this.propertiesTreeOutline.insertChild(item, index);
        item.listItemElement.textContent = "";
        item._newProperty = true;
        item.updateTitle();
        return item;
    },

    _handleEmptySpaceMouseDown: function()
    {
        this._willCauseCancelEditing = this._parentPane._isEditingStyle;
    },

    /**
     * @param {!Event} event
     */
    _handleEmptySpaceClick: function(event)
    {
        if (!this.editable)
            return;

        if (!event.target.isComponentSelectionCollapsed())
            return;

        if (this._checkWillCancelEditing())
            return;

        if (event.target.enclosingNodeOrSelfWithNodeName("a"))
            return;

        if (event.target.classList.contains("header") || this.element.classList.contains("read-only") || event.target.enclosingNodeOrSelfWithClass("media")) {
            event.consume();
            return;
        }
        this.addNewBlankProperty().startEditing();
        event.consume(true);
    },

    /**
     * @param {!WebInspector.CSSMedia} media
     * @param {!Element} element
     * @param {!Event} event
     */
    _handleMediaRuleClick: function(media, element, event)
    {
        if (WebInspector.isBeingEdited(element))
            return;

        if (WebInspector.KeyboardShortcut.eventHasCtrlOrMeta(/** @type {!MouseEvent} */(event)) && this.navigable) {
            var location = media.rawLocation();
            if (!location) {
                event.consume(true);
                return;
            }
            var uiLocation = WebInspector.cssWorkspaceBinding.rawLocationToUILocation(location);
            if (uiLocation)
                WebInspector.Revealer.reveal(uiLocation);
            event.consume(true);
            return;
        }

        var config = new WebInspector.InplaceEditor.Config(this._editingMediaCommitted.bind(this, media), this._editingMediaCancelled.bind(this, element), undefined, this._editingMediaBlurHandler.bind(this));
        WebInspector.InplaceEditor.startEditing(element, config);

        element.getComponentSelection().setBaseAndExtent(element, 0, element, 1);
        this._parentPane.setEditingStyle(true);
        var parentMediaElement = element.enclosingNodeOrSelfWithClass("media");
        parentMediaElement.classList.add("editing-media");

        event.consume(true);
    },

    /**
     * @param {!Element} element
     */
    _editingMediaFinished: function(element)
    {
        this._parentPane.setEditingStyle(false);
        var parentMediaElement = element.enclosingNodeOrSelfWithClass("media");
        parentMediaElement.classList.remove("editing-media");
    },

    /**
     * @param {!Element} element
     */
    _editingMediaCancelled: function(element)
    {
        this._editingMediaFinished(element);
        // Mark the selectors in group if necessary.
        // This is overridden by BlankStylePropertiesSection.
        this._markSelectorMatches();
        element.getComponentSelection().collapse(element, 0);
    },

    /**
     * @param {!Element} editor
     * @param {!Event} blurEvent
     * @return {boolean}
     */
    _editingMediaBlurHandler: function(editor, blurEvent)
    {
        return true;
    },

    /**
     * @param {!WebInspector.CSSMedia} media
     * @param {!Element} element
     * @param {string} newContent
     * @param {string} oldContent
     * @param {(!WebInspector.StylePropertyTreeElement.Context|undefined)} context
     * @param {string} moveDirection
     */
    _editingMediaCommitted: function(media, element, newContent, oldContent, context, moveDirection)
    {
        this._parentPane.setEditingStyle(false);
        this._editingMediaFinished(element);

        if (newContent)
            newContent = newContent.trim();

        /**
         * @param {?WebInspector.CSSMedia} newMedia
         * @this {WebInspector.StylePropertiesSection}
         */
        function userCallback(newMedia)
        {
            if (newMedia) {
                this._parentPane._styleSheetMediaEdited(media, newMedia);
                this._parentPane._refreshUpdate(this);
            }
            delete this._parentPane._userOperation;
            this._editingMediaTextCommittedForTest();
        }

        // This gets deleted in finishOperation(), which is called both on success and failure.
        this._parentPane._userOperation = true;
        this._parentPane._cssModel.setMediaText(media, newContent, userCallback.bind(this));
    },

    _editingMediaTextCommittedForTest: function() { },

    /**
     * @param {!Event} event
     */
    _handleSelectorClick: function(event)
    {
        if (WebInspector.KeyboardShortcut.eventHasCtrlOrMeta(/** @type {!MouseEvent} */(event)) && this.navigable && event.target.classList.contains("simple-selector")) {
            var index = event.target._selectorIndex;
            var cssModel = this._parentPane._cssModel;
            var rule = this._style.parentRule;
            var header = cssModel.styleSheetHeaderForId(/** @type {string} */(rule.styleSheetId));
            if (!header) {
                event.consume(true);
                return;
            }
            var rawLocation = new WebInspector.CSSLocation(header, rule.lineNumberInSource(index), rule.columnNumberInSource(index));
            var uiLocation = WebInspector.cssWorkspaceBinding.rawLocationToUILocation(rawLocation);
            if (uiLocation)
                WebInspector.Revealer.reveal(uiLocation);
            event.consume(true);
            return;
        }
        this._startEditingOnMouseEvent();
        event.consume(true);
    },

    _startEditingOnMouseEvent: function()
    {
        if (!this.editable)
            return;

        var rule = this._style.parentRule;
        if (!rule && !this.propertiesTreeOutline.rootElement().childCount()) {
            this.addNewBlankProperty().startEditing();
            return;
        }

        if (!rule)
            return;

        this.startEditingSelector();
    },

    startEditingSelector: function()
    {
        var element = this._selectorElement;
        if (WebInspector.isBeingEdited(element))
            return;

        element.scrollIntoViewIfNeeded(false);
        element.textContent = element.textContent; // Reset selector marks in group.

        var config = new WebInspector.InplaceEditor.Config(this.editingSelectorCommitted.bind(this), this.editingSelectorCancelled.bind(this));
        WebInspector.InplaceEditor.startEditing(this._selectorElement, config);

        element.getComponentSelection().setBaseAndExtent(element, 0, element, 1);
        this._parentPane.setEditingStyle(true);
    },

    /**
     * @param {string} moveDirection
     */
    _moveEditorFromSelector: function(moveDirection)
    {
        this._markSelectorMatches();

        if (!moveDirection)
            return;

        if (moveDirection === "forward") {
            var firstChild = this.propertiesTreeOutline.firstChild();
            while (firstChild && firstChild.inherited())
                firstChild = firstChild.nextSibling;
            if (!firstChild)
                this.addNewBlankProperty().startEditing();
            else
                firstChild.startEditing(firstChild.nameElement);
        } else {
            var previousSection = this.previousEditableSibling();
            if (!previousSection)
                return;

            previousSection.addNewBlankProperty().startEditing();
        }
    },

    /**
     * @param {!Element} element
     * @param {string} newContent
     * @param {string} oldContent
     * @param {(!WebInspector.StylePropertyTreeElement.Context|undefined)} context
     * @param {string} moveDirection
     */
    editingSelectorCommitted: function(element, newContent, oldContent, context, moveDirection)
    {
        this._editingSelectorEnded();
        if (newContent)
            newContent = newContent.trim();
        if (newContent === oldContent) {
            // Revert to a trimmed version of the selector if need be.
            this._selectorElement.textContent = newContent;
            this._moveEditorFromSelector(moveDirection);
            return;
        }
        var rule = this._style.parentRule;
        if (!rule)
            return;

        /**
         * @param {boolean} success
         * @this {WebInspector.StylePropertiesSection}
         */
        function headerTextCommitted(success)
        {
            delete this._parentPane._userOperation;
            this._moveEditorFromSelector(moveDirection);
            this._editingSelectorCommittedForTest();
        }

        // This gets deleted in finishOperationAndMoveEditor(), which is called both on success and failure.
        this._parentPane._userOperation = true;
        this._setHeaderText(rule, newContent).then(headerTextCommitted.bind(this));
    },

    /**
     * @param {!WebInspector.CSSRule} rule
     * @param {string} newContent
     * @return {!Promise.<boolean>}
     */
    _setHeaderText: function(rule, newContent)
    {
        /**
         * @param {!WebInspector.CSSRule} rule
         * @param {!WebInspector.TextRange} oldSelectorRange
         * @param {boolean} success
         * @return {boolean}
         * @this {WebInspector.StylePropertiesSection}
         */
        function updateSourceRanges(rule, oldSelectorRange, success)
        {
            if (success) {
                var doesAffectSelectedNode = rule.matchingSelectors.length > 0;
                this.element.classList.toggle("no-affect", !doesAffectSelectedNode);

                this._matchedStyles.resetActiveProperties();
                var newSelectorRange = /** @type {!WebInspector.TextRange} */(rule.selectorRange());
                rule.style.sourceStyleSheetEdited(/** @type {string} */(rule.styleSheetId), oldSelectorRange, newSelectorRange);
                this._parentPane._styleSheetRuleEdited(rule, oldSelectorRange, newSelectorRange);
                this._parentPane._refreshUpdate(this);
            }
            return true;
        }

        if (!(rule instanceof WebInspector.CSSStyleRule))
            return Promise.resolve(false);
        var oldSelectorRange = rule.selectorRange();
        if (!oldSelectorRange)
            return Promise.resolve(false);
        var selectedNode = this._parentPane.node();
        return rule.setSelectorText(selectedNode ? selectedNode.id : 0, newContent).then(updateSourceRanges.bind(this, rule, oldSelectorRange));
    },

    _editingSelectorCommittedForTest: function() { },

    _updateRuleOrigin: function()
    {
        this._selectorRefElement.removeChildren();
        this._selectorRefElement.appendChild(WebInspector.StylePropertiesSection.createRuleOriginNode(this._parentPane._cssModel, this._parentPane._linkifier, this._style.parentRule));
    },

    _editingSelectorEnded: function()
    {
        this._parentPane.setEditingStyle(false);
    },

    editingSelectorCancelled: function()
    {
        this._editingSelectorEnded();

        // Mark the selectors in group if necessary.
        // This is overridden by BlankStylePropertiesSection.
        this._markSelectorMatches();
    }
}

/**
 * @param {!WebInspector.CSSStyleModel} cssModel
 * @param {!WebInspector.Linkifier} linkifier
 * @param {?WebInspector.CSSRule} rule
 * @return {!Node}
 */
WebInspector.StylePropertiesSection.createRuleOriginNode = function(cssModel, linkifier, rule)
{
    if (!rule)
        return createTextNode("");

    var firstMatchingIndex = rule.matchingSelectors && rule.matchingSelectors.length ? rule.matchingSelectors[0] : 0;
    var ruleLocation;
    if (rule instanceof WebInspector.CSSStyleRule)
        ruleLocation = rule.selectors[firstMatchingIndex].range;
    else if (rule instanceof WebInspector.CSSKeyframeRule)
        ruleLocation = rule.key().range;

    var header = rule.styleSheetId ? cssModel.styleSheetHeaderForId(rule.styleSheetId) : null;
    if (ruleLocation && rule.styleSheetId && header && header.resourceURL())
        return WebInspector.StylePropertiesSection._linkifyRuleLocation(cssModel, linkifier, rule.styleSheetId, ruleLocation);

    if (rule.isUserAgent())
        return createTextNode(WebInspector.UIString("user agent stylesheet"));
    if (rule.isInjected())
        return createTextNode(WebInspector.UIString("injected stylesheet"));
    if (rule.isViaInspector())
        return createTextNode(WebInspector.UIString("via inspector"));

    if (header && header.ownerNode) {
        var link = WebInspector.DOMPresentationUtils.linkifyDeferredNodeReference(header.ownerNode);
        link.textContent = "<style>…</style>";
        return link;
    }

    return createTextNode("");
}

/**
 * @param {!WebInspector.CSSStyleModel} cssModel
 * @param {!WebInspector.Linkifier} linkifier
 * @param {string} styleSheetId
 * @param {!WebInspector.TextRange} ruleLocation
 * @return {!Node}
 */
WebInspector.StylePropertiesSection._linkifyRuleLocation = function(cssModel, linkifier, styleSheetId, ruleLocation)
{
    var styleSheetHeader = cssModel.styleSheetHeaderForId(styleSheetId);
    var lineNumber = styleSheetHeader.lineNumberInSource(ruleLocation.startLine);
    var columnNumber = styleSheetHeader.columnNumberInSource(ruleLocation.startLine, ruleLocation.startColumn);
    var matchingSelectorLocation = new WebInspector.CSSLocation(styleSheetHeader, lineNumber, columnNumber);
    return linkifier.linkifyCSSLocation(matchingSelectorLocation);
}

/**
 * @constructor
 * @extends {WebInspector.StylePropertiesSection}
 * @param {!WebInspector.StylesSidebarPane} stylesPane
 * @param {!WebInspector.CSSStyleModel.MatchedStyleResult} matchedStyles
 * @param {string} defaultSelectorText
 * @param {string} styleSheetId
 * @param {!WebInspector.TextRange} ruleLocation
 * @param {!WebInspector.CSSStyleDeclaration} insertAfterStyle
 */
WebInspector.BlankStylePropertiesSection = function(stylesPane, matchedStyles, defaultSelectorText, styleSheetId, ruleLocation, insertAfterStyle)
{
    var rule = WebInspector.CSSStyleRule.createDummyRule(stylesPane._cssModel, defaultSelectorText);
    WebInspector.StylePropertiesSection.call(this, stylesPane, matchedStyles, rule.style);
    this._ruleLocation = ruleLocation;
    this._styleSheetId = styleSheetId;
    this._selectorRefElement.removeChildren();
    this._selectorRefElement.appendChild(WebInspector.StylePropertiesSection._linkifyRuleLocation(this._parentPane._cssModel, this._parentPane._linkifier, styleSheetId, this._actualRuleLocation()));
    if (insertAfterStyle && insertAfterStyle.parentRule)
        this._createMediaList(insertAfterStyle.parentRule.media);
    this.element.classList.add("blank-section");
}

WebInspector.BlankStylePropertiesSection.prototype = {
    /**
     * @return {!WebInspector.TextRange}
     */
    _actualRuleLocation: function()
    {
        var prefix = this._rulePrefix();
        var lines = prefix.split("\n");
        var editRange = new WebInspector.TextRange(0, 0, lines.length - 1, lines.peekLast().length);
        return this._ruleLocation.rebaseAfterTextEdit(WebInspector.TextRange.createFromLocation(0, 0), editRange);
    },

    /**
     * @return {string}
     */
    _rulePrefix: function()
    {
        return this._ruleLocation.startLine === 0 && this._ruleLocation.startColumn === 0 ? "" : "\n\n";
    },

    /**
     * @return {boolean}
     */
    get isBlank()
    {
        return !this._normal;
    },

    /**
     * @override
     * @param {!Element} element
     * @param {string} newContent
     * @param {string} oldContent
     * @param {!WebInspector.StylePropertyTreeElement.Context|undefined} context
     * @param {string} moveDirection
     */
    editingSelectorCommitted: function(element, newContent, oldContent, context, moveDirection)
    {
        if (!this.isBlank) {
            WebInspector.StylePropertiesSection.prototype.editingSelectorCommitted.call(this, element, newContent, oldContent, context, moveDirection);
            return;
        }

        /**
         * @param {?WebInspector.CSSRule} newRule
         * @this {WebInspector.StylePropertiesSection}
         */
        function userCallback(newRule)
        {
            if (!newRule) {
                this.editingSelectorCancelled();
                this._editingSelectorCommittedForTest();
                return;
            }
            var doesSelectorAffectSelectedNode = newRule.matchingSelectors.length > 0;
            this._makeNormal(newRule);

            if (!doesSelectorAffectSelectedNode)
                this.element.classList.add("no-affect");

            var ruleTextLines = ruleText.split("\n");
            var startLine = this._ruleLocation.startLine;
            var startColumn = this._ruleLocation.startColumn;
            var newRange = new WebInspector.TextRange(startLine, startColumn, startLine + ruleTextLines.length - 1, startColumn + ruleTextLines[ruleTextLines.length - 1].length);
            this._parentPane._styleSheetRuleEdited(newRule, this._ruleLocation, newRange);

            this._updateRuleOrigin();
            if (this.element.parentElement) // Might have been detached already.
                this._moveEditorFromSelector(moveDirection);

            delete this._parentPane._userOperation;
            this._editingSelectorEnded();
            this._markSelectorMatches();

            this._editingSelectorCommittedForTest();
        }

        if (newContent)
            newContent = newContent.trim();
        this._parentPane._userOperation = true;

        var cssModel = this._parentPane._cssModel;
        var ruleText = this._rulePrefix() + newContent + " {}";
        cssModel.addRule(this._styleSheetId, this._parentPane.node(), ruleText, this._ruleLocation, userCallback.bind(this));
    },

    editingSelectorCancelled: function()
    {
        delete this._parentPane._userOperation;
        if (!this.isBlank) {
            WebInspector.StylePropertiesSection.prototype.editingSelectorCancelled.call(this);
            return;
        }

        this._editingSelectorEnded();
        this._parentPane.removeSection(this);
    },

    /**
     * @param {!WebInspector.CSSRule} newRule
     */
    _makeNormal: function(newRule)
    {
        this.element.classList.remove("blank-section");
        this._style = newRule.style;
        // FIXME: replace this instance by a normal WebInspector.StylePropertiesSection.
        this._normal = true;
    },

    __proto__: WebInspector.StylePropertiesSection.prototype
}

/**
 * @constructor
 * @extends {WebInspector.StylePropertiesSection}
 * @param {!WebInspector.StylesSidebarPane} stylesPane
 * @param {!WebInspector.CSSStyleModel.MatchedStyleResult} matchedStyles
 * @param {!WebInspector.CSSStyleDeclaration} style
 */
WebInspector.KeyframePropertiesSection = function(stylesPane, matchedStyles, style)
{
    WebInspector.StylePropertiesSection.call(this, stylesPane, matchedStyles, style);
    this._selectorElement.className = "keyframe-key";
}

WebInspector.KeyframePropertiesSection.prototype = {
    /**
     * @override
     * @return {string}
     */
    _headerText: function()
    {
        return this._style.parentRule.key().text;
    },

    /**
     * @override
     * @param {!WebInspector.CSSRule} rule
     * @param {string} newContent
     * @return {!Promise.<boolean>}
     */
    _setHeaderText: function(rule, newContent)
    {
        /**
         * @param {!WebInspector.CSSRule} rule
         * @param {!WebInspector.TextRange} oldRange
         * @param {boolean} success
         * @return {boolean}
         * @this {WebInspector.KeyframePropertiesSection}
         */
        function updateSourceRanges(rule, oldRange, success)
        {
            if (success) {
                var newRange = /** @type {!WebInspector.TextRange} */(rule.key().range);
                rule.style.sourceStyleSheetEdited(/** @type {string} */(rule.styleSheetId), oldRange, newRange);
                this._parentPane._styleSheetRuleEdited(rule, oldRange, newRange);
                this._parentPane._refreshUpdate(this);
            }
            return true;
        }

        if (!(rule instanceof WebInspector.CSSKeyframeRule))
            return Promise.resolve(false);
        var oldRange = rule.key().range;
        if (!oldRange)
            return Promise.resolve(false);
        var selectedNode = this._parentPane.node();
        return rule.setKeyText(newContent).then(updateSourceRanges.bind(this, rule, oldRange));
    },

    /**
     * @override
     * @param {string} propertyName
     * @return {boolean}
     */
    isPropertyInherited: function(propertyName)
    {
        return false;
    },

    /**
     * @override
     * @param {!WebInspector.CSSProperty} property
     * @return {boolean}
     */
    _isPropertyOverloaded: function(property)
    {
        return false;
    },

    /**
     * @override
     */
    _markSelectorHighlights: function()
    {
    },

    /**
     * @override
     */
    _markSelectorMatches: function()
    {
        this._selectorElement.textContent = this._style.parentRule.key().text;
    },

    /**
     * @override
     */
    _highlight: function()
    {
    },

    __proto__: WebInspector.StylePropertiesSection.prototype
}

/**
 * @constructor
 * @extends {TreeElement}
 * @param {!WebInspector.StylesSidebarPane} stylesPane
 * @param {!WebInspector.CSSStyleModel.MatchedStyleResult} matchedStyles
 * @param {!WebInspector.CSSProperty} property
 * @param {boolean} isShorthand
 * @param {boolean} inherited
 * @param {boolean} overloaded
 */
WebInspector.StylePropertyTreeElement = function(stylesPane, matchedStyles, property, isShorthand, inherited, overloaded)
{
    // Pass an empty title, the title gets made later in onattach.
    TreeElement.call(this, "", isShorthand);
    this._style = property.ownerStyle;
    this._matchedStyles = matchedStyles;
    this.property = property;
    this._inherited = inherited;
    this._overloaded = overloaded;
    this.selectable = false;
    this._parentPane = stylesPane;
    this.isShorthand = isShorthand;
    this._applyStyleThrottler = new WebInspector.Throttler(0);
}

/** @typedef {{expanded: boolean, hasChildren: boolean, isEditingName: boolean, previousContent: string}} */
WebInspector.StylePropertyTreeElement.Context;

WebInspector.StylePropertyTreeElement.prototype = {
    /**
     * @return {boolean}
     */
    _editable: function()
    {
        return this._style.styleSheetId && this._style.range;
    },

    /**
     * @return {boolean}
     */
    inherited: function()
    {
        return this._inherited;
    },

    /**
     * @return {boolean}
     */
    overloaded: function()
    {
        return this._overloaded;
    },

    /**
     * @param {boolean} x
     */
    setOverloaded: function(x)
    {
        if (x === this._overloaded)
            return;
        this._overloaded = x;
        this._updateState();
    },

    get name()
    {
        return this.property.name;
    },

    get value()
    {
        return this.property.value;
    },

    /**
     * @return {boolean}
     */
    _updateFilter: function()
    {
        var regex = this._parentPane.filterRegex();
        var matches = !!regex && (regex.test(this.property.name) || regex.test(this.property.value));
        this.listItemElement.classList.toggle("filter-match", matches);

        this.onpopulate();
        var hasMatchingChildren = false;
        for (var i = 0; i < this.childCount(); ++i)
            hasMatchingChildren |= this.childAt(i)._updateFilter();

        if (!regex) {
            if (this._expandedDueToFilter)
                this.collapse();
            this._expandedDueToFilter = false;
        } else if (hasMatchingChildren && !this.expanded) {
            this.expand();
            this._expandedDueToFilter = true;
        } else if (!hasMatchingChildren && this.expanded && this._expandedDueToFilter) {
            this.collapse();
            this._expandedDueToFilter = false;
        }
        return matches;
    },

    /**
     * @param {string} text
     * @return {!Node}
     */
    _processColor: function(text)
    {
        // We can be called with valid non-color values of |text| (like 'none' from border style)
        var color = WebInspector.Color.parse(text);
        if (!color)
            return createTextNode(text);

        if (!this._editable()) {
            var swatch = WebInspector.ColorSwatch.create();
            swatch.setColorText(text);
            return swatch;
        }

        var stylesPopoverHelper = this._parentPane._stylesPopoverHelper;
        var swatchIcon = new WebInspector.ColorSwatchPopoverIcon(this, stylesPopoverHelper, text);

        /**
         * @param {?Array<string>} backgroundColors
         */
        function computedCallback(backgroundColors)
        {
            // TODO(aboxhall): distinguish between !backgroundColors (no text) and
            // !backgroundColors.length (no computed bg color)
            if (!backgroundColors || !backgroundColors.length)
                return;
            // TODO(samli): figure out what to do in the case of multiple background colors (i.e. gradients)
            var bgColorText = backgroundColors[0];
            var bgColor = WebInspector.Color.parse(bgColorText);
            if (!bgColor)
                return;

            // If we have a semi-transparent background color over an unknown
            // background, draw the line for the "worst case" scenario: where
            // the unknown background is the same color as the text.
            if (bgColor.hasAlpha) {
                var blendedRGBA = [];
                WebInspector.Color.blendColors(bgColor.rgba(), color.rgba(), blendedRGBA);
                bgColor = new WebInspector.Color(blendedRGBA, WebInspector.Color.Format.RGBA);
            }

            swatchIcon.setContrastColor(bgColor);
        }

        if (this.property.name === "color" && this._parentPane.cssModel() && this.node()) {
            var cssModel = this._parentPane.cssModel();
            cssModel.backgroundColorsPromise(this.node().id).then(computedCallback);
        }

        return swatchIcon.element();
    },

    /**
     * @return {string}
     */
    renderedPropertyText: function()
    {
        return this.nameElement.textContent + ": " + this.valueElement.textContent;
    },

    /**
     * @param {string} text
     * @return {!Node}
     */
    _processBezier: function(text)
    {
        var geometry = WebInspector.Geometry.CubicBezier.parse(text);
        if (!geometry || !this._editable())
            return createTextNode(text);
        var stylesPopoverHelper = this._parentPane._stylesPopoverHelper;
        return new WebInspector.BezierPopoverIcon(this, stylesPopoverHelper, text).element();
    },

    _updateState: function()
    {
        if (!this.listItemElement)
            return;

        if (this._style.isPropertyImplicit(this.name))
            this.listItemElement.classList.add("implicit");
        else
            this.listItemElement.classList.remove("implicit");

        var hasIgnorableError = !this.property.parsedOk && WebInspector.StylesSidebarPane.ignoreErrorsForProperty(this.property);
        if (hasIgnorableError)
            this.listItemElement.classList.add("has-ignorable-error");
        else
            this.listItemElement.classList.remove("has-ignorable-error");

        if (this.inherited())
            this.listItemElement.classList.add("inherited");
        else
            this.listItemElement.classList.remove("inherited");

        if (this.overloaded())
            this.listItemElement.classList.add("overloaded");
        else
            this.listItemElement.classList.remove("overloaded");

        if (this.property.disabled)
            this.listItemElement.classList.add("disabled");
        else
            this.listItemElement.classList.remove("disabled");
    },

    /**
     * @return {?WebInspector.DOMNode}
     */
    node: function()
    {
        return this._parentPane.node();
    },

    /**
     * @return {!WebInspector.StylesSidebarPane}
     */
    parentPane: function()
    {
        return this._parentPane;
    },

    /**
     * @return {?WebInspector.StylePropertiesSection}
     */
    section: function()
    {
        return this.treeOutline && this.treeOutline.section;
    },

    _updatePane: function()
    {
        var section = this.section();
        if (section && section._parentPane)
            section._parentPane._refreshUpdate(section);
    },

    /**
     * @param {!WebInspector.TextRange} oldStyleRange
     */
    _styleTextEdited: function(oldStyleRange)
    {
        var newStyleRange = /** @type {!WebInspector.TextRange} */ (this._style.range);
        this._matchedStyles.resetActiveProperties();
        if (this._style.parentRule)
            this._parentPane._styleSheetRuleEdited(this._style.parentRule, oldStyleRange, newStyleRange);
    },

    /**
     * @param {!Event} event
     */
    _toggleEnabled: function(event)
    {
        var disabled = !event.target.checked;
        var oldStyleRange = this._style.range;
        if (!oldStyleRange)
            return;

        /**
         * @param {boolean} success
         * @this {WebInspector.StylePropertyTreeElement}
         */
        function callback(success)
        {
            delete this._parentPane._userOperation;

            if (!success)
                return;
            this._styleTextEdited(oldStyleRange);
            this._updatePane();
            this.styleTextAppliedForTest();
        }

        event.consume();
        this._parentPane._userOperation = true;
        this.property.setDisabled(disabled)
            .then(callback.bind(this));
    },

    /**
     * @override
     */
    onpopulate: function()
    {
        // Only populate once and if this property is a shorthand.
        if (this.childCount() || !this.isShorthand)
            return;

        var longhandProperties = this._style.longhandProperties(this.name);
        for (var i = 0; i < longhandProperties.length; ++i) {
            var name = longhandProperties[i].name;
            var inherited = false;
            var overloaded = false;

            var section = this.section();
            if (section) {
                inherited = section.isPropertyInherited(name);
                overloaded = this._matchedStyles.propertyState(longhandProperties[i]) === WebInspector.CSSStyleModel.MatchedStyleResult.PropertyState.Overloaded;
            }

            var item = new WebInspector.StylePropertyTreeElement(this._parentPane, this._matchedStyles, longhandProperties[i], false, inherited, overloaded);
            this.appendChild(item);
        }
    },

    /**
     * @override
     */
    onattach: function()
    {
        this.updateTitle();

        this.listItemElement.addEventListener("mousedown", this._mouseDown.bind(this));
        this.listItemElement.addEventListener("mouseup", this._resetMouseDownElement.bind(this));
        this.listItemElement.addEventListener("click", this._mouseClick.bind(this));
    },

    /**
     * @param {!Event} event
     */
    _mouseDown: function(event)
    {
        if (this._parentPane) {
            this._parentPane._mouseDownTreeElement = this;
            this._parentPane._mouseDownTreeElementIsName = this.nameElement && this.nameElement.isSelfOrAncestor(event.target);
            this._parentPane._mouseDownTreeElementIsValue = this.valueElement && this.valueElement.isSelfOrAncestor(event.target);
        }
    },

    _resetMouseDownElement: function()
    {
        if (this._parentPane) {
            delete this._parentPane._mouseDownTreeElement;
            delete this._parentPane._mouseDownTreeElementIsName;
            delete this._parentPane._mouseDownTreeElementIsValue;
        }
    },

    updateTitle: function()
    {
        this._updateState();
        this._expandElement = createElement("span");
        this._expandElement.className = "expand-element";

        var propertyRenderer = new WebInspector.StylesSidebarPropertyRenderer(this._style.parentRule, this.node(), this.name, this.value);
        if (this.property.parsedOk) {
            propertyRenderer.setColorHandler(this._processColor.bind(this));
            propertyRenderer.setBezierHandler(this._processBezier.bind(this));
        }

        this.listItemElement.removeChildren();
        this.nameElement = propertyRenderer.renderName();
        this.valueElement = propertyRenderer.renderValue();
        if (!this.treeOutline)
            return;

        var indent = WebInspector.moduleSetting("textEditorIndent").get();
        this.listItemElement.createChild("span", "styles-clipboard-only").createTextChild(indent + (this.property.disabled ? "/* " : ""));
        this.listItemElement.appendChild(this.nameElement);
        this.listItemElement.createTextChild(": ");
        this.listItemElement.appendChild(this._expandElement);
        this.listItemElement.appendChild(this.valueElement);
        this.listItemElement.createTextChild(";");
        if (this.property.disabled)
            this.listItemElement.createChild("span", "styles-clipboard-only").createTextChild(" */");

        if (!this.property.parsedOk) {
            // Avoid having longhands under an invalid shorthand.
            this.listItemElement.classList.add("not-parsed-ok");

            // Add a separate exclamation mark IMG element with a tooltip.
            this.listItemElement.insertBefore(WebInspector.StylesSidebarPane.createExclamationMark(this.property), this.listItemElement.firstChild);
        }
        if (!this.property.activeInStyle())
            this.listItemElement.classList.add("inactive");
        this._updateFilter();

        if (this.property.parsedOk && this.section() && this.parent.root) {
            var enabledCheckboxElement = createElement("input");
            enabledCheckboxElement.className = "enabled-button";
            enabledCheckboxElement.type = "checkbox";
            enabledCheckboxElement.checked = !this.property.disabled;
            enabledCheckboxElement.addEventListener("click", this._toggleEnabled.bind(this), false);
            this.listItemElement.insertBefore(enabledCheckboxElement, this.listItemElement.firstChild);
        }
    },

    /**
     * @param {!Event} event
     */
    _mouseClick: function(event)
    {
        if (!event.target.isComponentSelectionCollapsed())
            return;

        event.consume(true);

        if (event.target === this.listItemElement) {
            var section = this.section();
            if (!section || !section.editable)
                return;

            if (section._checkWillCancelEditing())
                return;
            section.addNewBlankProperty(this.property.index + 1).startEditing();
            return;
        }

        if (WebInspector.KeyboardShortcut.eventHasCtrlOrMeta(/** @type {!MouseEvent} */(event)) && this.section().navigable) {
            this._navigateToSource(/** @type {!Element} */(event.target));
            return;
        }

        this.startEditing(/** @type {!Element} */(event.target));
    },

    /**
     * @param {!Element} element
     */
    _navigateToSource: function(element)
    {
        console.assert(this.section().navigable);
        var propertyNameClicked = element === this.nameElement;
        var uiLocation = WebInspector.cssWorkspaceBinding.propertyUILocation(this.property, propertyNameClicked);
        if (uiLocation)
            WebInspector.Revealer.reveal(uiLocation);
    },

    /**
     * @param {?Element=} selectElement
     */
    startEditing: function(selectElement)
    {
        // FIXME: we don't allow editing of longhand properties under a shorthand right now.
        if (this.parent.isShorthand)
            return;

        if (selectElement === this._expandElement)
            return;

        var section = this.section();
        if (section && !section.editable)
            return;

        if (!selectElement)
            selectElement = this.nameElement; // No arguments passed in - edit the name element by default.
        else
            selectElement = selectElement.enclosingNodeOrSelfWithClass("webkit-css-property") || selectElement.enclosingNodeOrSelfWithClass("value");

        if (WebInspector.isBeingEdited(selectElement))
            return;

        var isEditingName = selectElement === this.nameElement;
        if (!isEditingName)
            this.valueElement.textContent = restoreURLs(this.valueElement.textContent, this.value);

        /**
         * @param {string} fieldValue
         * @param {string} modelValue
         * @return {string}
         */
        function restoreURLs(fieldValue, modelValue)
        {
            const urlRegex = /\b(url\([^)]*\))/g;
            var splitFieldValue = fieldValue.split(urlRegex);
            if (splitFieldValue.length === 1)
                return fieldValue;
            var modelUrlRegex = new RegExp(urlRegex);
            for (var i = 1; i < splitFieldValue.length; i += 2) {
                var match = modelUrlRegex.exec(modelValue);
                if (match)
                    splitFieldValue[i] = match[0];
            }
            return splitFieldValue.join("");
        }

        /** @type {!WebInspector.StylePropertyTreeElement.Context} */
        var context = {
            expanded: this.expanded,
            hasChildren: this.isExpandable(),
            isEditingName: isEditingName,
            previousContent: selectElement.textContent
        };

        // Lie about our children to prevent expanding on double click and to collapse shorthands.
        this.setExpandable(false);

        if (selectElement.parentElement)
            selectElement.parentElement.classList.add("child-editing");
        selectElement.textContent = selectElement.textContent; // remove color swatch and the like

        /**
         * @param {!WebInspector.StylePropertyTreeElement.Context} context
         * @param {!Event} event
         * @this {WebInspector.StylePropertyTreeElement}
         */
        function pasteHandler(context, event)
        {
            var data = event.clipboardData.getData("Text");
            if (!data)
                return;
            var colonIdx = data.indexOf(":");
            if (colonIdx < 0)
                return;
            var name = data.substring(0, colonIdx).trim();
            var value = data.substring(colonIdx + 1).trim();

            event.preventDefault();

            if (!("originalName" in context)) {
                context.originalName = this.nameElement.textContent;
                context.originalValue = this.valueElement.textContent;
            }
            this.property.name = name;
            this.property.value = value;
            this.nameElement.textContent = name;
            this.valueElement.textContent = value;
            this.nameElement.normalize();
            this.valueElement.normalize();

            this.editingCommitted(event.target.textContent, context, "forward");
        }

        /**
         * @param {!WebInspector.StylePropertyTreeElement.Context} context
         * @param {!Event} event
         * @this {WebInspector.StylePropertyTreeElement}
         */
        function blurListener(context, event)
        {
            var treeElement = this._parentPane._mouseDownTreeElement;
            var moveDirection = "";
            if (treeElement === this) {
                if (isEditingName && this._parentPane._mouseDownTreeElementIsValue)
                    moveDirection = "forward";
                if (!isEditingName && this._parentPane._mouseDownTreeElementIsName)
                    moveDirection = "backward";
            }
            var text = event.target.textContent;
            if (!context.isEditingName)
                text = this.value || text;
            this.editingCommitted(text, context, moveDirection);
        }

        this._originalPropertyText = this.property.propertyText;

        this._parentPane.setEditingStyle(true);
        if (selectElement.parentElement)
            selectElement.parentElement.scrollIntoViewIfNeeded(false);

        var applyItemCallback = !isEditingName ? this._applyFreeFlowStyleTextEdit.bind(this) : undefined;
        this._prompt = new WebInspector.StylesSidebarPane.CSSPropertyPrompt(isEditingName ? WebInspector.CSSMetadata.cssPropertiesMetainfo : WebInspector.CSSMetadata.keywordsForProperty(this.nameElement.textContent), this, isEditingName);
        this._prompt.setAutocompletionTimeout(0);
        if (applyItemCallback) {
            this._prompt.addEventListener(WebInspector.TextPrompt.Events.ItemApplied, applyItemCallback, this);
            this._prompt.addEventListener(WebInspector.TextPrompt.Events.ItemAccepted, applyItemCallback, this);
        }
        var proxyElement = this._prompt.attachAndStartEditing(selectElement, blurListener.bind(this, context));

        proxyElement.addEventListener("keydown", this._editingNameValueKeyDown.bind(this, context), false);
        proxyElement.addEventListener("keypress", this._editingNameValueKeyPress.bind(this, context), false);
        proxyElement.addEventListener("input", this._editingNameValueInput.bind(this, context), false);
        if (isEditingName)
            proxyElement.addEventListener("paste", pasteHandler.bind(this, context), false);

        selectElement.getComponentSelection().setBaseAndExtent(selectElement, 0, selectElement, 1);
    },

    /**
     * @param {!WebInspector.StylePropertyTreeElement.Context} context
     * @param {!Event} event
     */
    _editingNameValueKeyDown: function(context, event)
    {
        if (event.handled)
            return;

        var result;

        if (isEnterKey(event)) {
            event.preventDefault();
            result = "forward";
        } else if (event.keyCode === WebInspector.KeyboardShortcut.Keys.Esc.code || event.keyIdentifier === "U+001B")
            result = "cancel";
        else if (!context.isEditingName && this._newProperty && event.keyCode === WebInspector.KeyboardShortcut.Keys.Backspace.code) {
            // For a new property, when Backspace is pressed at the beginning of new property value, move back to the property name.
            var selection = event.target.getComponentSelection();
            if (selection.isCollapsed && !selection.focusOffset) {
                event.preventDefault();
                result = "backward";
            }
        } else if (event.keyIdentifier === "U+0009") { // Tab key.
            result = event.shiftKey ? "backward" : "forward";
            event.preventDefault();
        }

        if (result) {
            switch (result) {
            case "cancel":
                this.editingCancelled(null, context);
                break;
            case "forward":
            case "backward":
                this.editingCommitted(event.target.textContent, context, result);
                break;
            }

            event.consume();
            return;
        }
    },

    /**
     * @param {!WebInspector.StylePropertyTreeElement.Context} context
     * @param {!Event} event
     */
    _editingNameValueKeyPress: function(context, event)
    {
        /**
         * @param {string} text
         * @param {number} cursorPosition
         * @return {boolean}
         */
        function shouldCommitValueSemicolon(text, cursorPosition)
        {
            // FIXME: should this account for semicolons inside comments?
            var openQuote = "";
            for (var i = 0; i < cursorPosition; ++i) {
                var ch = text[i];
                if (ch === "\\" && openQuote !== "")
                    ++i; // skip next character inside string
                else if (!openQuote && (ch === "\"" || ch === "'"))
                    openQuote = ch;
                else if (openQuote === ch)
                    openQuote = "";
            }
            return !openQuote;
        }

        var keyChar = String.fromCharCode(event.charCode);
        var isFieldInputTerminated = (context.isEditingName ? keyChar === ":" : keyChar === ";" && shouldCommitValueSemicolon(event.target.textContent, event.target.selectionLeftOffset()));
        if (isFieldInputTerminated) {
            // Enter or colon (for name)/semicolon outside of string (for value).
            event.consume(true);
            this.editingCommitted(event.target.textContent, context, "forward");
            return;
        }
    },

    /**
     * @param {!WebInspector.StylePropertyTreeElement.Context} context
     * @param {!Event} event
     */
    _editingNameValueInput: function(context, event)
    {
        // Do not live-edit "content" property of pseudo elements. crbug.com/433889
        if (!context.isEditingName && (!this._parentPane.node().pseudoType() || this.name !== "content"))
            this._applyFreeFlowStyleTextEdit();
    },

    _applyFreeFlowStyleTextEdit: function()
    {
        var valueText = this.valueElement.textContent;
        if (valueText.indexOf(";") === -1)
            this.applyStyleText(this.nameElement.textContent + ": " + valueText, false);
    },

    kickFreeFlowStyleEditForTest: function()
    {
        this._applyFreeFlowStyleTextEdit();
    },

    /**
     * @param {!WebInspector.StylePropertyTreeElement.Context} context
     */
    editingEnded: function(context)
    {
        this._resetMouseDownElement();

        this.setExpandable(context.hasChildren);
        if (context.expanded)
            this.expand();
        var editedElement = context.isEditingName ? this.nameElement : this.valueElement;
        // The proxyElement has been deleted, no need to remove listener.
        if (editedElement.parentElement)
            editedElement.parentElement.classList.remove("child-editing");

        this._parentPane.setEditingStyle(false);
    },

    /**
     * @param {?Element} element
     * @param {!WebInspector.StylePropertyTreeElement.Context} context
     */
    editingCancelled: function(element, context)
    {
        this._removePrompt();
        this._revertStyleUponEditingCanceled();
        // This should happen last, as it clears the info necessary to restore the property value after [Page]Up/Down changes.
        this.editingEnded(context);
    },

    _revertStyleUponEditingCanceled: function()
    {
        if (this._propertyHasBeenEditedIncrementally) {
            this.applyStyleText(this._originalPropertyText, false);
            delete this._originalPropertyText;
        } else if (this._newProperty) {
            this.treeOutline.removeChild(this);
        } else {
            this.updateTitle();
        }
    },

    /**
     * @param {string} moveDirection
     * @return {?WebInspector.StylePropertyTreeElement}
     */
    _findSibling: function(moveDirection)
    {
        var target = this;
        do {
            target = (moveDirection === "forward" ? target.nextSibling : target.previousSibling);
        } while(target && target.inherited());

        return target;
    },

    /**
     * @param {string} userInput
     * @param {!WebInspector.StylePropertyTreeElement.Context} context
     * @param {string} moveDirection
     */
    editingCommitted: function(userInput, context, moveDirection)
    {
        this._removePrompt();
        this.editingEnded(context);
        var isEditingName = context.isEditingName;

        // Determine where to move to before making changes
        var createNewProperty, moveToPropertyName, moveToSelector;
        var isDataPasted = "originalName" in context;
        var isDirtyViaPaste = isDataPasted && (this.nameElement.textContent !== context.originalName || this.valueElement.textContent !== context.originalValue);
        var isPropertySplitPaste = isDataPasted && isEditingName && this.valueElement.textContent !== context.originalValue;
        var moveTo = this;
        var moveToOther = (isEditingName ^ (moveDirection === "forward"));
        var abandonNewProperty = this._newProperty && !userInput && (moveToOther || isEditingName);
        if (moveDirection === "forward" && (!isEditingName || isPropertySplitPaste) || moveDirection === "backward" && isEditingName) {
            moveTo = moveTo._findSibling(moveDirection);
            if (moveTo)
                moveToPropertyName = moveTo.name;
            else if (moveDirection === "forward" && (!this._newProperty || userInput))
                createNewProperty = true;
            else if (moveDirection === "backward")
                moveToSelector = true;
        }

        // Make the Changes and trigger the moveToNextCallback after updating.
        var moveToIndex = moveTo && this.treeOutline ? this.treeOutline.rootElement().indexOfChild(moveTo) : -1;
        var blankInput = userInput.isWhitespace();
        var shouldCommitNewProperty = this._newProperty && (isPropertySplitPaste || moveToOther || (!moveDirection && !isEditingName) || (isEditingName && blankInput));
        var section = /** @type {!WebInspector.StylePropertiesSection} */(this.section());
        if (((userInput !== context.previousContent || isDirtyViaPaste) && !this._newProperty) || shouldCommitNewProperty) {
            section._afterUpdate = moveToNextCallback.bind(this, this._newProperty, !blankInput, section);
            var propertyText;
            if (blankInput || (this._newProperty && this.valueElement.textContent.isWhitespace()))
                propertyText = "";
            else {
                if (isEditingName)
                    propertyText = userInput + ": " + this.property.value;
                else
                    propertyText = this.property.name + ": " + userInput;
            }
            this.applyStyleText(propertyText, true);
        } else {
            if (isEditingName)
                this.property.name = userInput;
            else
                this.property.value = userInput;
            if (!isDataPasted && !this._newProperty)
                this.updateTitle();
            moveToNextCallback.call(this, this._newProperty, false, section);
        }

        /**
         * The Callback to start editing the next/previous property/selector.
         * @param {boolean} alreadyNew
         * @param {boolean} valueChanged
         * @param {!WebInspector.StylePropertiesSection} section
         * @this {WebInspector.StylePropertyTreeElement}
         */
        function moveToNextCallback(alreadyNew, valueChanged, section)
        {
            if (!moveDirection)
                return;

            // User just tabbed through without changes.
            if (moveTo && moveTo.parent) {
                moveTo.startEditing(!isEditingName ? moveTo.nameElement : moveTo.valueElement);
                return;
            }

            // User has made a change then tabbed, wiping all the original treeElements.
            // Recalculate the new treeElement for the same property we were going to edit next.
            if (moveTo && !moveTo.parent) {
                var rootElement = section.propertiesTreeOutline.rootElement();
                if (moveDirection === "forward" && blankInput && !isEditingName)
                    --moveToIndex;
                if (moveToIndex >= rootElement.childCount() && !this._newProperty)
                    createNewProperty = true;
                else {
                    var treeElement = moveToIndex >= 0 ? rootElement.childAt(moveToIndex) : null;
                    if (treeElement) {
                        var elementToEdit = !isEditingName || isPropertySplitPaste ? treeElement.nameElement : treeElement.valueElement;
                        if (alreadyNew && blankInput)
                            elementToEdit = moveDirection === "forward" ? treeElement.nameElement : treeElement.valueElement;
                        treeElement.startEditing(elementToEdit);
                        return;
                    } else if (!alreadyNew)
                        moveToSelector = true;
                }
            }

            // Create a new attribute in this section (or move to next editable selector if possible).
            if (createNewProperty) {
                if (alreadyNew && !valueChanged && (isEditingName ^ (moveDirection === "backward")))
                    return;

                section.addNewBlankProperty().startEditing();
                return;
            }

            if (abandonNewProperty) {
                moveTo = this._findSibling(moveDirection);
                var sectionToEdit = (moveTo || moveDirection === "backward") ? section : section.nextEditableSibling();
                if (sectionToEdit) {
                    if (sectionToEdit.style().parentRule)
                        sectionToEdit.startEditingSelector();
                    else
                        sectionToEdit._moveEditorFromSelector(moveDirection);
                }
                return;
            }

            if (moveToSelector) {
                if (section.style().parentRule)
                    section.startEditingSelector();
                else
                    section._moveEditorFromSelector(moveDirection);
            }
        }
    },

    _removePrompt: function()
    {
        // BUG 53242. This cannot go into editingEnded(), as it should always happen first for any editing outcome.
        if (this._prompt) {
            this._prompt.detach();
            delete this._prompt;
        }
    },

    styleTextAppliedForTest: function() { },

    /**
     * @param {string} styleText
     * @param {boolean} majorChange
     */
    applyStyleText: function(styleText, majorChange)
    {
        this._applyStyleThrottler.schedule(this._innerApplyStyleText.bind(this, styleText, majorChange));
    },

    /**
     * @param {string} styleText
     * @param {boolean} majorChange
     * @return {!Promise.<undefined>}
     */
    _innerApplyStyleText: function(styleText, majorChange)
    {
        if (!this.treeOutline)
            return Promise.resolve();

        var oldStyleRange = this._style.range;
        if (!oldStyleRange)
            return Promise.resolve();

        styleText = styleText.replace(/\s/g, " ").trim(); // Replace &nbsp; with whitespace.
        if (!styleText.length && majorChange && this._newProperty && !this._propertyHasBeenEditedIncrementally) {
            // The user deleted everything and never applied a new property value via Up/Down scrolling/live editing, so remove the tree element and update.
            var section = this.section();
            this.parent.removeChild(this);
            section.afterUpdate();
            return Promise.resolve();
        }

        var currentNode = this._parentPane.node();
        this._parentPane._userOperation = true;

        /**
         * @param {boolean} success
         * @this {WebInspector.StylePropertyTreeElement}
         */
        function callback(success)
        {
            delete this._parentPane._userOperation;

            if (!success) {
                if (majorChange) {
                    // It did not apply, cancel editing.
                    this._revertStyleUponEditingCanceled();
                }
                this.styleTextAppliedForTest();
                return;
            }
            this._styleTextEdited(oldStyleRange);

            this._propertyHasBeenEditedIncrementally = true;
            this.property = this._style.propertyAt(this.property.index);

            // We are happy to update UI if user is not editing.
            if (!this._parentPane._isEditingStyle && currentNode === this.node())
                this._updatePane();

            this.styleTextAppliedForTest();
        }

        // Append a ";" if the new text does not end in ";".
        // FIXME: this does not handle trailing comments.
        if (styleText.length && !/;\s*$/.test(styleText))
            styleText += ";";
        var overwriteProperty = !this._newProperty || this._propertyHasBeenEditedIncrementally;
        return this.property.setText(styleText, majorChange, overwriteProperty)
            .then(callback.bind(this));
    },

    /**
     * @override
     * @return {boolean}
     */
    ondblclick: function()
    {
        return true; // handled
    },

    /**
     * @override
     * @param {!Event} event
     * @return {boolean}
     */
    isEventWithinDisclosureTriangle: function(event)
    {
        return event.target === this._expandElement;
    },

    __proto__: TreeElement.prototype
}

/**
 * @constructor
 * @extends {WebInspector.TextPrompt}
 * @param {!WebInspector.CSSMetadata} cssCompletions
 * @param {!WebInspector.StylePropertyTreeElement} treeElement
 * @param {boolean} isEditingName
 */
WebInspector.StylesSidebarPane.CSSPropertyPrompt = function(cssCompletions, treeElement, isEditingName)
{
    // Use the same callback both for applyItemCallback and acceptItemCallback.
    WebInspector.TextPrompt.call(this, this._buildPropertyCompletions.bind(this), WebInspector.StyleValueDelimiters);
    this.setSuggestBoxEnabled(true);
    this._cssCompletions = cssCompletions;
    this._treeElement = treeElement;
    this._isEditingName = isEditingName;

    if (!isEditingName)
        this.disableDefaultSuggestionForEmptyInput();
}

WebInspector.StylesSidebarPane.CSSPropertyPrompt.prototype = {
    /**
     * @override
     * @param {!Event} event
     */
    onKeyDown: function(event)
    {
        switch (event.keyIdentifier) {
        case "Up":
        case "Down":
        case "PageUp":
        case "PageDown":
            if (this._handleNameOrValueUpDown(event)) {
                event.preventDefault();
                return;
            }
            break;
        case "Enter":
            // Accept any available autocompletions and advance to the next field.
            if (this.autoCompleteElement && this.autoCompleteElement.textContent.length) {
                this.tabKeyPressed();
                return;
            }
            break;
        }

        WebInspector.TextPrompt.prototype.onKeyDown.call(this, event);
    },

    /**
     * @override
     * @param {!Event} event
     */
    onMouseWheel: function(event)
    {
        if (this._handleNameOrValueUpDown(event)) {
            event.consume(true);
            return;
        }
        WebInspector.TextPrompt.prototype.onMouseWheel.call(this, event);
    },

    /**
     * @override
     * @return {boolean}
     */
    tabKeyPressed: function()
    {
        this.acceptAutoComplete();

        // Always tab to the next field.
        return false;
    },

    /**
     * @param {!Event} event
     * @return {boolean}
     */
    _handleNameOrValueUpDown: function(event)
    {
        /**
         * @param {string} originalValue
         * @param {string} replacementString
         * @this {WebInspector.StylesSidebarPane.CSSPropertyPrompt}
         */
        function finishHandler(originalValue, replacementString)
        {
            // Synthesize property text disregarding any comments, custom whitespace etc.
            this._treeElement.applyStyleText(this._treeElement.nameElement.textContent + ": " + this._treeElement.valueElement.textContent, false);
        }

        /**
         * @param {string} prefix
         * @param {number} number
         * @param {string} suffix
         * @return {string}
         * @this {WebInspector.StylesSidebarPane.CSSPropertyPrompt}
         */
        function customNumberHandler(prefix, number, suffix)
        {
            if (number !== 0 && !suffix.length && WebInspector.CSSMetadata.isLengthProperty(this._treeElement.property.name))
                suffix = "px";
            return prefix + number + suffix;
        }

        // Handle numeric value increment/decrement only at this point.
        if (!this._isEditingName && WebInspector.handleElementValueModifications(event, this._treeElement.valueElement, finishHandler.bind(this), this._isValueSuggestion.bind(this), customNumberHandler.bind(this)))
            return true;

        return false;
    },

    /**
     * @param {string} word
     * @return {boolean}
     */
    _isValueSuggestion: function(word)
    {
        if (!word)
            return false;
        word = word.toLowerCase();
        return this._cssCompletions.keySet().hasOwnProperty(word);
    },

    /**
     * @param {!Element} proxyElement
     * @param {string} text
     * @param {number} cursorOffset
     * @param {!Range} wordRange
     * @param {boolean} force
     * @param {function(!Array.<string>, number=)} completionsReadyCallback
     */
    _buildPropertyCompletions: function(proxyElement, text, cursorOffset, wordRange, force, completionsReadyCallback)
    {
        var prefix = wordRange.toString().toLowerCase();
        if (!prefix && !force && (this._isEditingName || proxyElement.textContent.length)) {
            completionsReadyCallback([]);
            return;
        }

        var results = this._cssCompletions.startsWith(prefix);
        if (!this._isEditingName && !results.length && prefix.length > 1 && "!important".startsWith(prefix))
            results.push("!important");
        var userEnteredText = wordRange.toString().replace("-", "");
        if (userEnteredText && (userEnteredText === userEnteredText.toUpperCase())) {
            for (var i = 0; i < results.length; ++i)
                results[i] = results[i].toUpperCase();
        }
        var selectedIndex = this._cssCompletions.mostUsedOf(results);
        completionsReadyCallback(results, selectedIndex);
    },

    __proto__: WebInspector.TextPrompt.prototype
}

/**
 * @constructor
 * @param {?WebInspector.CSSRule} rule
 * @param {?WebInspector.DOMNode} node
 * @param {string} name
 * @param {string} value
 */
WebInspector.StylesSidebarPropertyRenderer = function(rule, node, name, value)
{
    this._rule = rule;
    this._node = node;
    this._propertyName = name;
    this._propertyValue = value;
}

WebInspector.StylesSidebarPropertyRenderer._colorRegex = /((?:rgb|hsl)a?\([^)]+\)|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|\b\w+\b(?!-))/g;
WebInspector.StylesSidebarPropertyRenderer._bezierRegex = /((cubic-bezier\([^)]+\))|\b(linear|ease-in-out|ease-in|ease-out|ease)\b)/g;

/**
 * @param {string} value
 * @return {!RegExp}
 */
WebInspector.StylesSidebarPropertyRenderer._urlRegex = function(value)
{
    // Heuristically choose between single-quoted, double-quoted or plain URL regex.
    if (/url\(\s*'.*\s*'\s*\)/.test(value))
        return /url\(\s*('.+')\s*\)/g;
    if (/url\(\s*".*\s*"\s*\)/.test(value))
        return /url\(\s*(".+")\s*\)/g;
    return /url\(\s*([^)]+)\s*\)/g;
}

WebInspector.StylesSidebarPropertyRenderer.prototype = {
    /**
     * @param {function(string):!Node} handler
     */
    setColorHandler: function(handler)
    {
        this._colorHandler = handler;
    },

    /**
     * @param {function(string):!Node} handler
     */
    setBezierHandler: function(handler)
    {
        this._bezierHandler = handler;
    },

    /**
     * @return {!Element}
     */
    renderName: function()
    {
        var nameElement = createElement("span");
        nameElement.className = "webkit-css-property";
        nameElement.textContent = this._propertyName;
        nameElement.normalize();
        return nameElement;
    },

    /**
     * @return {!Element}
     */
    renderValue: function()
    {
        var valueElement = createElement("span");
        valueElement.className = "value";

        if (!this._propertyValue)
            return valueElement;

        var formatter = new WebInspector.StringFormatter();
        formatter.addProcessor(WebInspector.StylesSidebarPropertyRenderer._urlRegex(this._propertyValue), this._processURL.bind(this));
        if (this._bezierHandler && WebInspector.CSSMetadata.isBezierAwareProperty(this._propertyName))
            formatter.addProcessor(WebInspector.StylesSidebarPropertyRenderer._bezierRegex, this._bezierHandler);
        if (this._colorHandler && WebInspector.CSSMetadata.isColorAwareProperty(this._propertyName))
            formatter.addProcessor(WebInspector.StylesSidebarPropertyRenderer._colorRegex, this._colorHandler);

        valueElement.appendChild(formatter.formatText(this._propertyValue));
        valueElement.normalize();
        return valueElement;
    },

    /**
     * @param {string} url
     * @return {!Node}
     */
    _processURL: function(url)
    {
        var hrefUrl = url;
        var match = hrefUrl.match(/['"]?([^'"]+)/);
        if (match)
            hrefUrl = match[1];
        var container = createDocumentFragment();
        container.createTextChild("url(");
        if (this._rule && this._rule.resourceURL())
            hrefUrl = WebInspector.ParsedURL.completeURL(this._rule.resourceURL(), hrefUrl);
        else if (this._node)
            hrefUrl = this._node.resolveURL(hrefUrl);
        var hasResource = hrefUrl && !!WebInspector.resourceForURL(hrefUrl);
        // FIXME: WebInspector.linkifyURLAsNode() should really use baseURI.
        container.appendChild(WebInspector.linkifyURLAsNode(hrefUrl || url, url, undefined, !hasResource));
        container.createTextChild(")");
        return container;
    }
}


/**
 * @return {!WebInspector.ToolbarItem}
 */
WebInspector.StylesSidebarPane.createAddNewRuleButton = function(stylesSidebarPane)
{
    var button = new WebInspector.ToolbarButton(WebInspector.UIString("New Style Rule"), "add-toolbar-item");
    button.addEventListener("click", stylesSidebarPane._createNewRuleInViaInspectorStyleSheet, stylesSidebarPane);
    button.element.createChild("div", "long-click-glyph toolbar-button-theme");
    new WebInspector.LongClickController(button.element, stylesSidebarPane._onAddButtonLongClick.bind(stylesSidebarPane));
    WebInspector.context.addFlavorChangeListener(WebInspector.DOMNode, onNodeChanged);
    onNodeChanged();
    return button;

    function onNodeChanged()
    {
        var node = WebInspector.context.flavor(WebInspector.DOMNode);
        button.setEnabled(!!node);
    }
}
;/* ComputedStyleWidget.js */
/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
 * Copyright (C) 2009 Joseph Pecoraro
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
 * @extends {WebInspector.ThrottledWidget}
 * @param {!WebInspector.StylesSidebarPane} stylesSidebarPane
 * @param {!WebInspector.SharedSidebarModel} sharedModel
 * @param {function(!WebInspector.CSSProperty)} revealCallback
 */
WebInspector.ComputedStyleWidget = function(stylesSidebarPane, sharedModel, revealCallback)
{
    WebInspector.ThrottledWidget.call(this);
    this.element.classList.add("computed-style-sidebar-pane");

    this.registerRequiredCSS("elements/computedStyleSidebarPane.css");
    this._alwaysShowComputedProperties = { "display": true, "height": true, "width": true };

    this._sharedModel = sharedModel;
    this._sharedModel.addEventListener(WebInspector.SharedSidebarModel.Events.ComputedStyleChanged, this.update, this);

    this._showInheritedComputedStylePropertiesSetting = WebInspector.settings.createSetting("showInheritedComputedStyleProperties", false);
    this._showInheritedComputedStylePropertiesSetting.addChangeListener(this._showInheritedComputedStyleChanged.bind(this));

    var hbox = this.element.createChild("div", "hbox styles-sidebar-pane-toolbar");
    var filterContainerElement = hbox.createChild("div", "styles-sidebar-pane-filter-box");
    var filterInput = WebInspector.StylesSidebarPane.createPropertyFilterElement(WebInspector.UIString("Filter"), hbox, filterCallback.bind(this));
    filterContainerElement.appendChild(filterInput);

    var toolbar = new WebInspector.Toolbar("styles-pane-toolbar", hbox);
    toolbar.appendToolbarItem(new WebInspector.ToolbarCheckbox(WebInspector.UIString("Show all"), undefined, this._showInheritedComputedStylePropertiesSetting));

    this._propertiesOutline = new TreeOutlineInShadow();
    this._propertiesOutline.hideOverflow();
    this._propertiesOutline.registerRequiredCSS("elements/computedStyleSidebarPane.css");
    this._propertiesOutline.element.classList.add("monospace", "computed-properties");
    this.element.appendChild(this._propertiesOutline.element);

    this._stylesSidebarPane = stylesSidebarPane;
    this._linkifier = new WebInspector.Linkifier(new WebInspector.Linkifier.DefaultCSSFormatter());
    this._revealCallback = revealCallback;

    /**
     * @param {?RegExp} regex
     * @this {WebInspector.ComputedStyleWidget}
     */
    function filterCallback(regex)
    {
        this._filterRegex = regex;
        this._updateFilter(regex);
    }
}

/**
 * @param {!WebInspector.StylesSidebarPane} stylesSidebarPane
 * @param {!WebInspector.SharedSidebarModel} sharedModel
 * @param {function(!WebInspector.CSSProperty)} revealCallback
 * @return {!WebInspector.ElementsSidebarViewWrapperPane}
 */
WebInspector.ComputedStyleWidget.createSidebarWrapper = function(stylesSidebarPane, sharedModel, revealCallback)
{
    var widget = new WebInspector.ComputedStyleWidget(stylesSidebarPane, sharedModel, revealCallback);
    return new WebInspector.ElementsSidebarViewWrapperPane(WebInspector.UIString("Computed Style"), widget)
}

WebInspector.ComputedStyleWidget._propertySymbol = Symbol("property");

WebInspector.ComputedStyleWidget.prototype = {
    _showInheritedComputedStyleChanged: function()
    {
        this.update();
    },

    /**
     * @override
     * @return {!Promise.<?>}
     */
    doUpdate: function()
    {
        var promises = [
            this._sharedModel.fetchComputedStyle(),
            this._stylesSidebarPane.fetchMatchedCascade()
        ];
        return Promise.all(promises)
            .spread(this._innerRebuildUpdate.bind(this));
    },

    /**
     * @param {string} text
     * @return {!Node}
     */
    _processColor: function(text)
    {
        var color = WebInspector.Color.parse(text);
        if (!color)
            return createTextNode(text);
        var swatch = WebInspector.ColorSwatch.create();
        swatch.setColorText(text);
        swatch.setFormat(WebInspector.Color.detectColorFormat(color));
        return swatch;
    },

    /**
     * @param {?WebInspector.SharedSidebarModel.ComputedStyle} nodeStyle
     * @param {?WebInspector.CSSStyleModel.MatchedStyleResult} matchedStyles
     */
    _innerRebuildUpdate: function(nodeStyle, matchedStyles)
    {
        this._propertiesOutline.removeChildren();
        this._linkifier.reset();
        var cssModel = this._sharedModel.cssModel();
        if (!nodeStyle || !matchedStyles || !cssModel)
            return;

        var uniqueProperties = nodeStyle.computedStyle.keysArray();
        uniqueProperties.sort(propertySorter);

        var propertyTraces = this._computePropertyTraces(matchedStyles);
        var inhertiedProperties = this._computeInheritedProperties(matchedStyles);
        var showInherited = this._showInheritedComputedStylePropertiesSetting.get();
        for (var i = 0; i < uniqueProperties.length; ++i) {
            var propertyName = uniqueProperties[i];
            var propertyValue = nodeStyle.computedStyle.get(propertyName);
            var canonicalName = WebInspector.CSSMetadata.canonicalPropertyName(propertyName);
            var inherited = !inhertiedProperties.has(canonicalName);
            if (!showInherited && inherited && !(propertyName in this._alwaysShowComputedProperties))
                continue;
            if (propertyName !== canonicalName && propertyValue === nodeStyle.computedStyle.get(canonicalName))
                continue;

            var propertyElement = createElement("div");
            propertyElement.classList.add("computed-style-property");
            propertyElement.classList.toggle("computed-style-property-inherited", inherited);
            var renderer = new WebInspector.StylesSidebarPropertyRenderer(null, nodeStyle.node, propertyName, /** @type {string} */(propertyValue));
            renderer.setColorHandler(this._processColor.bind(this));
            var propertyNameElement = renderer.renderName();
            propertyNameElement.classList.add("property-name");
            propertyElement.appendChild(propertyNameElement);

            var colon = createElementWithClass("span", "delimeter");
            colon.textContent = ":";
            propertyNameElement.appendChild(colon);

            var propertyValueElement = propertyElement.createChild("span", "property-value");

            var propertyValueText = renderer.renderValue();
            propertyValueText.classList.add("property-value-text");
            propertyValueElement.appendChild(propertyValueText);

            var semicolon = createElementWithClass("span", "delimeter");
            semicolon.textContent = ";";
            propertyValueElement.appendChild(semicolon);

            var treeElement = new TreeElement();
            treeElement.selectable = false;
            treeElement.title = propertyElement;
            treeElement[WebInspector.ComputedStyleWidget._propertySymbol] = {
                name: propertyName,
                value: propertyValue
            };
            var isOdd = this._propertiesOutline.rootElement().children().length % 2 === 0;
            treeElement.listItemElement.classList.toggle("odd-row", isOdd);
            this._propertiesOutline.appendChild(treeElement);

            var trace = propertyTraces.get(propertyName);
            if (trace) {
                var activeProperty = this._renderPropertyTrace(cssModel, matchedStyles, nodeStyle.node, treeElement, trace);
                treeElement.listItemElement.addEventListener("mousedown", consumeEvent, false);
                treeElement.listItemElement.addEventListener("dblclick", consumeEvent, false);
                treeElement.listItemElement.addEventListener("click", handleClick.bind(null, treeElement), false);
                var gotoSourceElement = propertyValueElement.createChild("div", "goto-source-icon");
                gotoSourceElement.addEventListener("click", this._navigateToSource.bind(this, activeProperty));
            }
        }

        this._updateFilter(this._filterRegex);

        /**
         * @param {string} a
         * @param {string} b
         * @return {number}
         */
        function propertySorter(a, b)
        {
            if (a.startsWith("-webkit") ^ b.startsWith("-webkit"))
                return a.startsWith("-webkit") ? 1 : -1;
            var canonicalName = WebInspector.CSSMetadata.canonicalPropertyName;
            return canonicalName(a).compareTo(canonicalName(b));
        }

        /**
         * @param {!TreeElement} treeElement
         * @param {!Event} event
         */
        function handleClick(treeElement, event)
        {
            if (!treeElement.expanded)
                treeElement.expand();
            else
                treeElement.collapse();
            consumeEvent(event);
        }
    },

    /**
     * @param {!WebInspector.CSSProperty} cssProperty
     * @param {!Event} event
     */
    _navigateToSource: function(cssProperty, event)
    {
        if (this._revealCallback)
            this._revealCallback.call(null, cssProperty);
        event.consume(true);
    },

    /**
     * @param {!WebInspector.CSSStyleModel} cssModel
     * @param {!WebInspector.CSSStyleModel.MatchedStyleResult} matchedStyles
     * @param {!WebInspector.DOMNode} node
     * @param {!TreeElement} rootTreeElement
     * @param {!Array<!WebInspector.CSSProperty>} tracedProperties
     * @return {!WebInspector.CSSProperty}
     */
    _renderPropertyTrace: function(cssModel, matchedStyles, node, rootTreeElement, tracedProperties)
    {
        var activeProperty = null;
        for (var property of tracedProperties) {
            var trace = createElement("div");
            trace.classList.add("property-trace");
            if (matchedStyles.propertyState(property) === WebInspector.CSSStyleModel.MatchedStyleResult.PropertyState.Overloaded)
                trace.classList.add("property-trace-inactive");
            else
                activeProperty = property;

            var renderer = new WebInspector.StylesSidebarPropertyRenderer(null, node, property.name, /** @type {string} */(property.value));
            renderer.setColorHandler(this._processColor.bind(this));
            var valueElement = renderer.renderValue();
            valueElement.classList.add("property-trace-value");
            valueElement.addEventListener("click", this._navigateToSource.bind(this, property), false);
            var gotoSourceElement = createElement("div");
            gotoSourceElement.classList.add("goto-source-icon");
            gotoSourceElement.addEventListener("click", this._navigateToSource.bind(this, property));
            valueElement.insertBefore(gotoSourceElement, valueElement.firstChild);

            trace.appendChild(valueElement);

            var rule = property.ownerStyle.parentRule;
            if (rule) {
                var linkSpan = trace.createChild("span", "trace-link");
                linkSpan.appendChild(WebInspector.StylePropertiesSection.createRuleOriginNode(cssModel, this._linkifier, rule));
            }

            var selectorElement = trace.createChild("span", "property-trace-selector");
            selectorElement.textContent = rule ? rule.selectorText() : "element.style";
            selectorElement.title = selectorElement.textContent;

            var traceTreeElement = new TreeElement();
            traceTreeElement.title = trace;
            traceTreeElement.selectable = false;
            rootTreeElement.appendChild(traceTreeElement);
        }
        return /** @type {!WebInspector.CSSProperty} */(activeProperty);
    },

    /**
     * @param {!WebInspector.CSSStyleModel.MatchedStyleResult} matchedStyles
     * @return {!Map<string, !Array<!WebInspector.CSSProperty>>}
     */
    _computePropertyTraces: function(matchedStyles)
    {
        var result = new Map();
        for (var style of matchedStyles.nodeStyles()) {
            var allProperties = style.allProperties;
            for (var property of allProperties) {
                if (!property.activeInStyle() || !matchedStyles.propertyState(property))
                    continue;
                if (!result.has(property.name))
                    result.set(property.name, []);
                result.get(property.name).push(property);
            }
        }
        return result;
    },

    /**
     * @param {!WebInspector.CSSStyleModel.MatchedStyleResult} matchedStyles
     * @return {!Set<string>}
     */
    _computeInheritedProperties: function(matchedStyles)
    {
        var result = new Set();
        for (var style of matchedStyles.nodeStyles()) {
            for (var property of style.allProperties) {
                if (!matchedStyles.propertyState(property))
                    continue;
                result.add(WebInspector.CSSMetadata.canonicalPropertyName(property.name));
            }
        }
        return result;
    },

    /**
     * @param {?RegExp} regex
     */
    _updateFilter: function(regex)
    {
        var children = this._propertiesOutline.rootElement().children();
        for (var child of children) {
            var property = child[WebInspector.ComputedStyleWidget._propertySymbol];
            var matched = !regex || regex.test(property.name) || regex.test(property.value);
            child.hidden = !matched;
        }
    },

    __proto__: WebInspector.ThrottledWidget.prototype
}
;/* ElementsPanel.js */
/*
 * Copyright (C) 2007, 2008 Apple Inc.  All rights reserved.
 * Copyright (C) 2008 Matt Lilek <webkit@mattlilek.com>
 * Copyright (C) 2009 Joseph Pecoraro
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
 * @implements {WebInspector.Searchable}
 * @implements {WebInspector.TargetManager.Observer}
 * @extends {WebInspector.Panel}
 */
WebInspector.ElementsPanel = function()
{
    WebInspector.Panel.call(this, "elements");
    this.registerRequiredCSS("elements/elementsPanel.css");

    this._splitWidget = new WebInspector.SplitWidget(true, true, "elementsPanelSplitViewState", 325, 325);
    this._splitWidget.addEventListener(WebInspector.SplitWidget.Events.SidebarSizeChanged, this._updateTreeOutlineVisibleWidth.bind(this));
    this._splitWidget.show(this.element);

    this._searchableView = new WebInspector.SearchableView(this);
    this._searchableView.setMinimumSize(25, 28);
    this._searchableView.setPlaceholder(WebInspector.UIString("Find by string, selector, or XPath"));
    var stackElement = this._searchableView.element;

    this._contentElement = createElement("div");
    var crumbsContainer = createElement("div");
    stackElement.appendChild(this._contentElement);
    stackElement.appendChild(crumbsContainer);

    this._splitWidget.setMainWidget(this._searchableView);

    this._contentElement.id = "elements-content";
    // FIXME: crbug.com/425984
    if (WebInspector.moduleSetting("domWordWrap").get())
        this._contentElement.classList.add("elements-wrap");
    WebInspector.moduleSetting("domWordWrap").addChangeListener(this._domWordWrapSettingChanged.bind(this));

    crumbsContainer.id = "elements-crumbs";
    this._breadcrumbs = new WebInspector.ElementsBreadcrumbs();
    this._breadcrumbs.show(crumbsContainer);
    this._breadcrumbs.addEventListener(WebInspector.ElementsBreadcrumbs.Events.NodeSelected, this._crumbNodeSelected, this);

    this.sidebarPanes = {};
    /** @type !Array<!WebInspector.ElementsSidebarViewWrapperPane> */
    this._elementsSidebarViewWrappers = [];
    this._currentToolbarPane = null;

    var sharedSidebarModel = new WebInspector.SharedSidebarModel();
    this.sidebarPanes.platformFonts = WebInspector.PlatformFontsWidget.createSidebarWrapper(sharedSidebarModel);
    this.sidebarPanes.styles = new WebInspector.StylesSidebarPane();
    this.sidebarPanes.computedStyle = WebInspector.ComputedStyleWidget.createSidebarWrapper(this.sidebarPanes.styles, sharedSidebarModel, this._revealProperty.bind(this));

    this.sidebarPanes.metrics = new WebInspector.MetricsSidebarPane();
    this.sidebarPanes.properties = WebInspector.PropertiesWidget.createSidebarWrapper();
    this.sidebarPanes.domBreakpoints = WebInspector.domBreakpointsSidebarPane.createProxy(this);
    this.sidebarPanes.eventListeners = WebInspector.EventListenersWidget.createSidebarWrapper();

    this._stylesSidebarToolbar = this._createStylesSidebarToolbar(this.sidebarPanes.styles);

    WebInspector.moduleSetting("sidebarPosition").addChangeListener(this._updateSidebarPosition.bind(this));
    this._updateSidebarPosition();
    this._loadSidebarViews();

    /** @type {!Array.<!WebInspector.ElementsTreeOutline>} */
    this._treeOutlines = [];
    /** @type {!Map.<!WebInspector.DOMModel, !WebInspector.ElementsTreeOutline>} */
    this._modelToTreeOutline = new Map();
    WebInspector.targetManager.observeTargets(this);
    WebInspector.moduleSetting("showUAShadowDOM").addChangeListener(this._showUAShadowDOMChanged.bind(this));
    WebInspector.targetManager.addModelListener(WebInspector.DOMModel, WebInspector.DOMModel.Events.DocumentUpdated, this._documentUpdatedEvent, this);
    WebInspector.extensionServer.addEventListener(WebInspector.ExtensionServer.Events.SidebarPaneAdded, this._extensionSidebarPaneAdded, this);
}

WebInspector.ElementsPanel._elementsSidebarViewTitleSymbol = Symbol("title");

WebInspector.ElementsPanel.prototype = {
    /**
     * @param {!WebInspector.CSSProperty} cssProperty
     */
    _revealProperty: function(cssProperty)
    {
        var stylesSidebarPane = this.sidebarPanes.styles;
        this.sidebarPaneView.selectTab(stylesSidebarPane.title());
        stylesSidebarPane.revealProperty(/** @type {!WebInspector.CSSProperty} */(cssProperty));
        return Promise.resolve();
    },

    /**
     * @param {!WebInspector.StylesSidebarPane} ssp
     * @return {!Element}
     */
    _createStylesSidebarToolbar: function(ssp)
    {
        var container = createElementWithClass("div", "styles-sidebar-pane-toolbar-container");
        var hbox = container.createChild("div", "hbox styles-sidebar-pane-toolbar");
        var filterContainerElement = hbox.createChild("div", "styles-sidebar-pane-filter-box");
        var filterInput = WebInspector.StylesSidebarPane.createPropertyFilterElement(WebInspector.UIString("Filter"), hbox, ssp.onFilterChanged.bind(ssp));
        filterContainerElement.appendChild(filterInput);
        var toolbar = new WebInspector.ExtensibleToolbar("styles-sidebarpane-toolbar", hbox);
        toolbar.onLoad().then(() => toolbar.appendToolbarItem(WebInspector.StylesSidebarPane.createAddNewRuleButton(ssp)));
        toolbar.element.classList.add("styles-pane-toolbar");
        toolbar.makeToggledGray();
        var toolbarPaneContainer = container.createChild("div", "styles-sidebar-toolbar-pane-container");
        this._toolbarPaneElement = createElementWithClass("div", "styles-sidebar-toolbar-pane");
        toolbarPaneContainer.appendChild(this._toolbarPaneElement);
        return container;
    },

    /**
     * @param {?WebInspector.Widget} widget
     */
    showToolbarPane: function(widget)
    {
        if (this._animatedToolbarPane !== undefined)
            this._pendingWidget = widget;
        else
            this._startToolbarPaneAnimation(widget);
    },

    /**
     * @param {?WebInspector.Widget} widget
     */
    _startToolbarPaneAnimation: function(widget)
    {
        if (widget === this._currentToolbarPane)
            return;

        if (widget && this._currentToolbarPane) {
            this._currentToolbarPane.detach();
            widget.show(this._toolbarPaneElement);
            this._currentToolbarPane = widget;
            this._currentToolbarPane.focus();
            return;
        }

        this._animatedToolbarPane = widget;

        if (this._currentToolbarPane)
            this._toolbarPaneElement.style.animationName = 'styles-element-state-pane-slideout';
        else if (widget)
            this._toolbarPaneElement.style.animationName = 'styles-element-state-pane-slidein';

        if (widget)
            widget.show(this._toolbarPaneElement);

        var listener = onAnimationEnd.bind(this);
        this._toolbarPaneElement.addEventListener("animationend", listener, false);

        /**
         * @this {WebInspector.ElementsPanel}
         */
        function onAnimationEnd()
        {
            this._toolbarPaneElement.style.removeProperty('animation-name');
            this._toolbarPaneElement.removeEventListener("animationend", listener, false);

            if (this._currentToolbarPane)
                this._currentToolbarPane.detach();

            this._currentToolbarPane = this._animatedToolbarPane;
            if (this._currentToolbarPane)
                this._currentToolbarPane.focus();
            delete this._animatedToolbarPane;

            if (this._pendingWidget !== undefined) {
                this._startToolbarPaneAnimation(this._pendingWidget);
                delete this._pendingWidget;
            }
        }
    },

    _toggleHideElement: function()
    {
        var node = this.selectedDOMNode();
        var treeOutline = this._treeOutlineForNode(node);
        if (!node || !treeOutline)
            return;
        treeOutline.toggleHideElement(node);
    },

    _toggleEditAsHTML: function()
    {
        var node = this.selectedDOMNode();
        var treeOutline = this._treeOutlineForNode(node);
        if (!node || !treeOutline)
            return;
        treeOutline.toggleEditAsHTML(node);
    },

    _loadSidebarViews: function()
    {
        var extensions = self.runtime.extensions("@WebInspector.Widget");

        for (var i = 0; i < extensions.length; ++i) {
            var descriptor = extensions[i].descriptor();
            if (descriptor["location"] !== "elements-panel")
                continue;

            var title = WebInspector.UIString(descriptor["title"]);
            extensions[i].instancePromise().then(addSidebarView.bind(this, title));
        }

        /**
         * @param {string} title
         * @param {!Object} object
         * @this {WebInspector.ElementsPanel}
         */
        function addSidebarView(title, object)
        {
            var widget = /** @type {!WebInspector.Widget} */ (object);
            var elementsSidebarViewWrapperPane = new WebInspector.ElementsSidebarViewWrapperPane(title, widget);
            this._elementsSidebarViewWrappers.push(elementsSidebarViewWrapperPane);

            if (this.sidebarPaneView)
                this.sidebarPaneView.addPane(elementsSidebarViewWrapperPane);
        }
    },

    /**
     * @override
     * @param {!WebInspector.Target} target
     */
    targetAdded: function(target)
    {
        var domModel = WebInspector.DOMModel.fromTarget(target);
        if (!domModel)
            return;
        var treeOutline = new WebInspector.ElementsTreeOutline(domModel, true, true);
        treeOutline.setWordWrap(WebInspector.moduleSetting("domWordWrap").get());
        treeOutline.wireToDOMModel();
        treeOutline.addEventListener(WebInspector.ElementsTreeOutline.Events.SelectedNodeChanged, this._selectedNodeChanged, this);
        treeOutline.addEventListener(WebInspector.ElementsTreeOutline.Events.ElementsTreeUpdated, this._updateBreadcrumbIfNeeded, this);
        new WebInspector.ElementsTreeElementHighlighter(treeOutline);
        this._treeOutlines.push(treeOutline);
        this._modelToTreeOutline.set(domModel, treeOutline);

        // Perform attach if necessary.
        if (this.isShowing())
            this.wasShown();

    },

    /**
     * @override
     * @param {!WebInspector.Target} target
     */
    targetRemoved: function(target)
    {
        var domModel = WebInspector.DOMModel.fromTarget(target);
        if (!domModel)
            return;
        var treeOutline = this._modelToTreeOutline.remove(domModel);
        treeOutline.unwireFromDOMModel();
        this._treeOutlines.remove(treeOutline);
        treeOutline.element.remove();
    },

    _updateTreeOutlineVisibleWidth: function()
    {
        if (!this._treeOutlines.length)
            return;

        var width = this._splitWidget.element.offsetWidth;
        if (this._splitWidget.isVertical())
            width -= this._splitWidget.sidebarSize();
        for (var i = 0; i < this._treeOutlines.length; ++i) {
            this._treeOutlines[i].setVisibleWidth(width);
            this._treeOutlines[i].updateSelection();
        }
        this._breadcrumbs.updateSizes();
    },

    /**
     * @override
     * @return {!Element}
     */
    defaultFocusedElement: function()
    {
        return this._treeOutlines.length ? this._treeOutlines[0].element : this.element;
    },

    /**
     * @override
     * @return {!WebInspector.SearchableView}
     */
    searchableView: function()
    {
        return this._searchableView;
    },

    wasShown: function()
    {
        WebInspector.context.setFlavor(WebInspector.ElementsPanel, this);

        for (var i = 0; i < this._treeOutlines.length; ++i) {
            var treeOutline = this._treeOutlines[i];
            // Attach heavy component lazily
            if (treeOutline.element.parentElement !== this._contentElement)
                this._contentElement.appendChild(treeOutline.element);
        }
        WebInspector.Panel.prototype.wasShown.call(this);
        this._breadcrumbs.update();

        for (var i = 0; i < this._treeOutlines.length; ++i) {
            var treeOutline = this._treeOutlines[i];
            treeOutline.updateSelection();
            treeOutline.setVisible(true);

            if (!treeOutline.rootDOMNode)
                if (treeOutline.domModel().existingDocument())
                    this._documentUpdated(treeOutline.domModel(), treeOutline.domModel().existingDocument());
                else
                    treeOutline.domModel().requestDocument();
        }

    },

    willHide: function()
    {
        WebInspector.context.setFlavor(WebInspector.ElementsPanel, null);

        WebInspector.DOMModel.hideDOMNodeHighlight();
        for (var i = 0; i < this._treeOutlines.length; ++i) {
            var treeOutline = this._treeOutlines[i];
            treeOutline.setVisible(false);
            // Detach heavy component on hide
            this._contentElement.removeChild(treeOutline.element);
        }
        if (this._popoverHelper)
            this._popoverHelper.hidePopover();
        WebInspector.Panel.prototype.willHide.call(this);
    },

    onResize: function()
    {
        if (WebInspector.moduleSetting("sidebarPosition").get() === "auto")
            this.element.window().requestAnimationFrame(this._updateSidebarPosition.bind(this));  // Do not force layout.
        this._updateTreeOutlineVisibleWidth();
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _selectedNodeChanged: function(event)
    {
        var selectedNode = /** @type {?WebInspector.DOMNode} */ (event.data);
        for (var i = 0; i < this._treeOutlines.length; ++i) {
            if (!selectedNode || selectedNode.domModel() !== this._treeOutlines[i].domModel())
                this._treeOutlines[i].selectDOMNode(null);
        }

        if (!selectedNode && this._lastValidSelectedNode)
            this._selectedPathOnReset = this._lastValidSelectedNode.path();

        this._breadcrumbs.setSelectedNode(selectedNode);

        WebInspector.context.setFlavor(WebInspector.DOMNode, selectedNode);

        if (selectedNode) {
            selectedNode.setAsInspectedNode();
            this._lastValidSelectedNode = selectedNode;

            var executionContexts = selectedNode.target().runtimeModel.executionContexts();
            var nodeFrameId = selectedNode.frameId();
            for (var context of executionContexts) {
                if (context.frameId == nodeFrameId) {
                    WebInspector.context.setFlavor(WebInspector.ExecutionContext, context);
                    break;
                }
            }
        }
        WebInspector.notifications.dispatchEventToListeners(WebInspector.NotificationService.Events.SelectedNodeChanged);
        this._selectedNodeChangedForTest();
    },

    _selectedNodeChangedForTest: function() { },

    _reset: function()
    {
        delete this.currentQuery;
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _documentUpdatedEvent: function(event)
    {
        this._documentUpdated(/** @type {!WebInspector.DOMModel} */ (event.target), /** @type {?WebInspector.DOMDocument} */ (event.data));
    },

    /**
     * @param {!WebInspector.DOMModel} domModel
     * @param {?WebInspector.DOMDocument} inspectedRootDocument
     */
    _documentUpdated: function(domModel, inspectedRootDocument)
    {
        this._reset();
        this.searchCanceled();

        var treeOutline = this._modelToTreeOutline.get(domModel);
        treeOutline.rootDOMNode = inspectedRootDocument;

        if (!inspectedRootDocument) {
            if (this.isShowing())
                domModel.requestDocument();
            return;
        }

        WebInspector.domBreakpointsSidebarPane.restoreBreakpoints(domModel);

        /**
         * @this {WebInspector.ElementsPanel}
         * @param {?WebInspector.DOMNode} candidateFocusNode
         */
        function selectNode(candidateFocusNode)
        {
            if (!candidateFocusNode)
                candidateFocusNode = inspectedRootDocument.body || inspectedRootDocument.documentElement;

            if (!candidateFocusNode)
                return;

            if (!this._pendingNodeReveal) {
                this.selectDOMNode(candidateFocusNode);
                if (treeOutline.selectedTreeElement)
                    treeOutline.selectedTreeElement.expand();
            }
        }

        /**
         * @param {?DOMAgent.NodeId} nodeId
         * @this {WebInspector.ElementsPanel}
         */
        function selectLastSelectedNode(nodeId)
        {
            if (this.selectedDOMNode()) {
                // Focused node has been explicitly set while reaching out for the last selected node.
                return;
            }
            var node = nodeId ? domModel.nodeForId(nodeId) : null;
            selectNode.call(this, node);
        }

        if (this._omitDefaultSelection)
            return;

        if (this._selectedPathOnReset)
            domModel.pushNodeByPathToFrontend(this._selectedPathOnReset, selectLastSelectedNode.bind(this));
        else
            selectNode.call(this, null);
        delete this._selectedPathOnReset;
    },

    /**
     * @override
     */
    searchCanceled: function()
    {
        delete this._searchQuery;
        this._hideSearchHighlights();

        this._searchableView.updateSearchMatchesCount(0);

        delete this._currentSearchResultIndex;
        delete this._searchResults;

        WebInspector.DOMModel.cancelSearch();
    },

    /**
     * @override
     * @param {!WebInspector.SearchableView.SearchConfig} searchConfig
     * @param {boolean} shouldJump
     * @param {boolean=} jumpBackwards
     */
    performSearch: function(searchConfig, shouldJump, jumpBackwards)
    {
        var query = searchConfig.query;
        // Call searchCanceled since it will reset everything we need before doing a new search.
        this.searchCanceled();

        const whitespaceTrimmedQuery = query.trim();
        if (!whitespaceTrimmedQuery.length)
            return;

        this._searchQuery = query;

        var promises = [];
        var domModels = WebInspector.DOMModel.instances();
        for (var domModel of domModels)
            promises.push(domModel.performSearchPromise(whitespaceTrimmedQuery, WebInspector.moduleSetting("showUAShadowDOM").get()));
        Promise.all(promises).then(resultCountCallback.bind(this));

        /**
         * @param {!Array.<number>} resultCounts
         * @this {WebInspector.ElementsPanel}
         */
        function resultCountCallback(resultCounts)
        {
            /**
             * @type {!Array.<{domModel: !WebInspector.DOMModel, index: number, node: (?WebInspector.DOMNode|undefined)}>}
             */
            this._searchResults = [];
            for (var i = 0; i < resultCounts.length; ++i) {
                var resultCount = resultCounts[i];
                for (var j = 0; j < resultCount; ++j)
                    this._searchResults.push({domModel: domModels[i], index: j, node: undefined});
            }
            this._searchableView.updateSearchMatchesCount(this._searchResults.length);
            if (!this._searchResults.length)
                return;
            this._currentSearchResultIndex = -1;

            if (shouldJump)
                this._jumpToSearchResult(jumpBackwards ? -1 : 0);
        }
    },

    _domWordWrapSettingChanged: function(event)
    {
        // FIXME: crbug.com/425984
        this._contentElement.classList.toggle("elements-wrap", event.data);
        for (var i = 0; i < this._treeOutlines.length; ++i)
            this._treeOutlines[i].setWordWrap(/** @type {boolean} */ (event.data));

        var selectedNode = this.selectedDOMNode();
        if (!selectedNode)
            return;

        var treeElement = this._treeElementForNode(selectedNode);
        if (treeElement)
            treeElement.updateSelection(); // Recalculate selection highlight dimensions.
    },

    switchToAndFocus: function(node)
    {
        // Reset search restore.
        this._searchableView.cancelSearch();
        WebInspector.inspectorView.setCurrentPanel(this);
        this.selectDOMNode(node, true);
    },

    /**
     * @param {!Element} element
     * @param {!Event} event
     * @return {!Element|!AnchorBox|undefined}
     */
    _getPopoverAnchor: function(element, event)
    {
        var anchor = element.enclosingNodeOrSelfWithClass("webkit-html-resource-link");
        if (!anchor || !anchor.href)
            return;

        return anchor;
    },

    /**
     * @param {!Element} anchor
     * @param {!WebInspector.Popover} popover
     */
    _showPopover: function(anchor, popover)
    {
        var node = this.selectedDOMNode();
        if (node)
            WebInspector.DOMPresentationUtils.buildImagePreviewContents(node.target(), anchor.href, true, showPopover);

        /**
         * @param {!Element=} contents
         */
        function showPopover(contents)
        {
            if (!contents)
                return;
            popover.setCanShrink(false);
            popover.showForAnchor(contents, anchor);
        }
    },

    _jumpToSearchResult: function(index)
    {
        this._hideSearchHighlights();
        this._currentSearchResultIndex = (index + this._searchResults.length) % this._searchResults.length;
        this._highlightCurrentSearchResult();
    },

    /**
     * @override
     */
    jumpToNextSearchResult: function()
    {
        if (!this._searchResults)
            return;
        this._jumpToSearchResult(this._currentSearchResultIndex + 1);
    },

    /**
     * @override
     */
    jumpToPreviousSearchResult: function()
    {
        if (!this._searchResults)
            return;
        this._jumpToSearchResult(this._currentSearchResultIndex - 1);
    },

    /**
     * @override
     * @return {boolean}
     */
    supportsCaseSensitiveSearch: function()
    {
        return false;
    },

    /**
     * @override
     * @return {boolean}
     */
    supportsRegexSearch: function()
    {
        return false;
    },

    _highlightCurrentSearchResult: function()
    {
        var index = this._currentSearchResultIndex;
        var searchResults = this._searchResults;
        var searchResult = searchResults[index];

        if (searchResult.node === null) {
            this._searchableView.updateCurrentMatchIndex(index);
            return;
        }

        /**
         * @param {?WebInspector.DOMNode} node
         * @this {WebInspector.ElementsPanel}
         */
        function searchCallback(node)
        {
            searchResult.node = node;
            this._highlightCurrentSearchResult();
        }

        if (typeof searchResult.node === "undefined") {
            // No data for slot, request it.
            searchResult.domModel.searchResult(searchResult.index, searchCallback.bind(this));
            return;
        }

        this._searchableView.updateCurrentMatchIndex(index);

        var treeElement = this._treeElementForNode(searchResult.node);
        if (treeElement) {
            treeElement.highlightSearchResults(this._searchQuery);
            treeElement.reveal();
            var matches = treeElement.listItemElement.getElementsByClassName(WebInspector.highlightedSearchResultClassName);
            if (matches.length)
                matches[0].scrollIntoViewIfNeeded(false);
        }
    },

    _hideSearchHighlights: function()
    {
        if (!this._searchResults || !this._searchResults.length || this._currentSearchResultIndex < 0)
            return;
        var searchResult = this._searchResults[this._currentSearchResultIndex];
        if (!searchResult.node)
            return;
        var treeOutline = this._modelToTreeOutline.get(searchResult.node.domModel());
        var treeElement = treeOutline.findTreeElement(searchResult.node);
        if (treeElement)
            treeElement.hideSearchHighlights();
    },

    /**
     * @return {?WebInspector.DOMNode}
     */
    selectedDOMNode: function()
    {
        for (var i = 0; i < this._treeOutlines.length; ++i) {
            var treeOutline = this._treeOutlines[i];
            if (treeOutline.selectedDOMNode())
                return treeOutline.selectedDOMNode();
        }
        return null;
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @param {boolean=} focus
     */
    selectDOMNode: function(node, focus)
    {
        for (var i = 0; i < this._treeOutlines.length; ++i) {
            var treeOutline = this._treeOutlines[i];
            if (treeOutline.domModel() === node.domModel())
                treeOutline.selectDOMNode(node, focus);
            else
                treeOutline.selectDOMNode(null);
        }
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _updateBreadcrumbIfNeeded: function(event)
    {
        var nodes = /** @type {!Array.<!WebInspector.DOMNode>} */ (event.data);
        this._breadcrumbs.updateNodes(nodes);
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _crumbNodeSelected: function(event)
    {
        var node = /** @type {!WebInspector.DOMNode} */ (event.data);
        this.selectDOMNode(node, true);
    },

    /**
     * @override
     * @param {!KeyboardEvent} event
     */
    handleShortcut: function(event)
    {
        /**
         * @param {!WebInspector.ElementsTreeOutline} treeOutline
         */
        function handleUndoRedo(treeOutline)
        {
            if (WebInspector.KeyboardShortcut.eventHasCtrlOrMeta(event) && !event.shiftKey && event.keyIdentifier === "U+005A") { // Z key
                treeOutline.domModel().undo();
                event.handled = true;
                return;
            }

            var isRedoKey = WebInspector.isMac() ? event.metaKey && event.shiftKey && event.keyIdentifier === "U+005A" : // Z key
                                                   event.ctrlKey && event.keyIdentifier === "U+0059"; // Y key
            if (isRedoKey) {
                treeOutline.domModel().redo();
                event.handled = true;
            }
        }

        if (WebInspector.isEditing() && event.keyCode !== WebInspector.KeyboardShortcut.Keys.F2.code)
            return;

        var treeOutline = null;
        for (var i = 0; i < this._treeOutlines.length; ++i) {
            if (this._treeOutlines[i].selectedDOMNode() === this._lastValidSelectedNode)
                treeOutline = this._treeOutlines[i];
        }
        if (!treeOutline)
            return;

        if (!treeOutline.editing()) {
            handleUndoRedo.call(null, treeOutline);
            if (event.handled) {
                this.sidebarPanes.styles.onUndoOrRedoHappened();
                return;
            }
        }

        treeOutline.handleShortcut(event);
        if (event.handled)
            return;

        WebInspector.Panel.prototype.handleShortcut.call(this, event);
    },

    /**
     * @param {?WebInspector.DOMNode} node
     * @return {?WebInspector.ElementsTreeOutline}
     */
    _treeOutlineForNode: function(node)
    {
        if (!node)
            return null;
        return this._modelToTreeOutline.get(node.domModel()) || null;
    },

    /**
     * @return {?WebInspector.ElementsTreeOutline}
     */
    _focusedTreeOutline: function()
    {
        for (var i = 0; i < this._treeOutlines.length; ++i) {
            if (this._treeOutlines[i].hasFocus())
                return this._treeOutlines[i];
        }
        return null;
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @return {?WebInspector.ElementsTreeElement}
     */
    _treeElementForNode: function(node)
    {
        var treeOutline = this._treeOutlineForNode(node);
        return /** @type {?WebInspector.ElementsTreeElement} */ (treeOutline.findTreeElement(node));
    },

    /**
     * @param {!Event} event
     */
    handleCopyEvent: function(event)
    {
        var treeOutline = this._focusedTreeOutline();
        if (treeOutline)
            treeOutline.handleCopyOrCutKeyboardEvent(false, event);
    },

    /**
     * @param {!Event} event
     */
    handleCutEvent: function(event)
    {
        var treeOutline = this._focusedTreeOutline();
        if (treeOutline)
            treeOutline.handleCopyOrCutKeyboardEvent(true, event);
    },

    /**
     * @param {!Event} event
     */
    handlePasteEvent: function(event)
    {
        var treeOutline = this._focusedTreeOutline();
        if (treeOutline)
            treeOutline.handlePasteKeyboardEvent(event);
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @return {!WebInspector.DOMNode}
     */
    _leaveUserAgentShadowDOM: function(node)
    {
        var userAgentShadowRoot = node.ancestorUserAgentShadowRoot();
        return userAgentShadowRoot ? /** @type {!WebInspector.DOMNode} */ (userAgentShadowRoot.parentNode) : node;
    },

    /**
     * @param {!WebInspector.DOMNode} node
     */
    revealAndSelectNode: function(node)
    {
        if (WebInspector.inspectElementModeController && WebInspector.inspectElementModeController.isInInspectElementMode())
            WebInspector.inspectElementModeController.stopInspection();

        this._omitDefaultSelection = true;

        var showLayoutEditor = !!WebInspector.inspectElementModeController && WebInspector.inspectElementModeController.isInLayoutEditorMode();
        WebInspector.inspectorView.setCurrentPanel(this, showLayoutEditor);
        node = WebInspector.moduleSetting("showUAShadowDOM").get() ? node : this._leaveUserAgentShadowDOM(node);
        if (!showLayoutEditor)
            node.highlightForTwoSeconds();

        this.selectDOMNode(node, true);
        delete this._omitDefaultSelection;

        if (!this._notFirstInspectElement)
            InspectorFrontendHost.inspectElementCompleted();
        this._notFirstInspectElement = true;
    },

    /**
     * @param {!Event} event
     * @param {!WebInspector.ContextMenu} contextMenu
     * @param {!Object} object
     */
    appendApplicableItems: function(event, contextMenu, object)
    {
        if (!(object instanceof WebInspector.RemoteObject && (/** @type {!WebInspector.RemoteObject} */ (object)).isNode())
            && !(object instanceof WebInspector.DOMNode)
            && !(object instanceof WebInspector.DeferredDOMNode)) {
            return;
        }

        // Add debbuging-related actions
        if (object instanceof WebInspector.DOMNode) {
            contextMenu.appendSeparator();
            WebInspector.domBreakpointsSidebarPane.populateNodeContextMenu(object, contextMenu, true);
        }

        // Skip adding "Reveal..." menu item for our own tree outline.
        if (this.element.isAncestor(/** @type {!Node} */ (event.target)))
            return;
        var commandCallback = WebInspector.Revealer.reveal.bind(WebInspector.Revealer, object);

        contextMenu.appendItem(WebInspector.UIString.capitalize("Reveal in Elements ^panel"), commandCallback);
    },

    _sidebarContextMenuEventFired: function(event)
    {
        var contextMenu = new WebInspector.ContextMenu(event);
        contextMenu.appendApplicableItems(/** @type {!Object} */ (event.deepElementFromPoint()));
        contextMenu.show();
    },

    _showUAShadowDOMChanged: function()
    {
        for (var i = 0; i < this._treeOutlines.length; ++i)
            this._treeOutlines[i].update();
    },

    _updateSidebarPosition: function()
    {
        var horizontally;
        var position = WebInspector.moduleSetting("sidebarPosition").get();
        if (position === "right")
            horizontally = false;
        else if (position === "bottom")
            horizontally = true;
        else
            horizontally = WebInspector.inspectorView.element.offsetWidth < 680;

        if (this.sidebarPaneView && horizontally === !this._splitWidget.isVertical())
            return;

        if (this.sidebarPaneView && this.sidebarPaneView.shouldHideOnDetach())
            return; // We can't reparent extension iframes.

        var selectedTabId = this.sidebarPaneView ? this.sidebarPaneView.selectedTabId : null;

        var extensionSidebarPanes = WebInspector.extensionServer.sidebarPanes();
        if (this.sidebarPaneView) {
            this.sidebarPaneView.detach();
            this._splitWidget.uninstallResizer(this.sidebarPaneView.headerElement());
        }

        this._splitWidget.setVertical(!horizontally);
        this.showToolbarPane(null);

        var computedPane = new WebInspector.SidebarPane(WebInspector.UIString("Computed"));
        computedPane.element.classList.add("composite");
        computedPane.element.classList.add("fill");
        computedPane.element.classList.add("metrics-and-computed");

        var matchedStylesContainer = new WebInspector.VBox();
        matchedStylesContainer.element.appendChild(this._stylesSidebarToolbar);
        var matchedStylePanesWrapper = new WebInspector.VBox();
        matchedStylePanesWrapper.element.classList.add("style-panes-wrapper");
        matchedStylePanesWrapper.show(matchedStylesContainer.element);
        var computedStylePanesWrapper = new WebInspector.VBox();
        computedStylePanesWrapper.element.classList.add("style-panes-wrapper");

        /**
         * @param {boolean} inComputedStyle
         * @this {WebInspector.ElementsPanel}
         */
        function showMetrics(inComputedStyle)
        {
            if (inComputedStyle)
                this.sidebarPanes.metrics.show(computedStylePanesWrapper.element, this.sidebarPanes.computedStyle.element);
            else
                this.sidebarPanes.metrics.show(matchedStylePanesWrapper.element);
        }

        /**
         * @param {!WebInspector.Event} event
         * @this {WebInspector.ElementsPanel}
         */
        function tabSelected(event)
        {
            var tabId = /** @type {string} */ (event.data.tabId);
            if (tabId === computedPane.title())
                showMetrics.call(this, true);
            else if (tabId === stylesPane.title())
                showMetrics.call(this, false);
        }

        this.sidebarPaneView = new WebInspector.SidebarTabbedPane();
        this.sidebarPaneView.element.addEventListener("contextmenu", this._sidebarContextMenuEventFired.bind(this), false);
        if (this._popoverHelper)
            this._popoverHelper.hidePopover();
        this._popoverHelper = new WebInspector.PopoverHelper(this.sidebarPaneView.element, this._getPopoverAnchor.bind(this), this._showPopover.bind(this));
        this._popoverHelper.setTimeout(0);

        if (horizontally) {
            this._splitWidget.installResizer(this.sidebarPaneView.headerElement());

            var compositePane = new WebInspector.SidebarPane(this.sidebarPanes.styles.title());
            compositePane.element.classList.add("composite");
            compositePane.element.classList.add("fill");

            var splitWidget = new WebInspector.SplitWidget(true, true, "stylesPaneSplitViewState", 215);
            splitWidget.show(compositePane.element);

            splitWidget.setMainWidget(matchedStylesContainer);
            splitWidget.setSidebarWidget(computedStylePanesWrapper);

            computedPane.show(computedStylePanesWrapper.element);
            this.sidebarPaneView.addPane(compositePane);
        } else {
            var stylesPane = new WebInspector.SidebarPane(this.sidebarPanes.styles.title());
            stylesPane.element.classList.add("composite", "fill", "metrics-and-styles");

            matchedStylesContainer.show(stylesPane.element);
            computedStylePanesWrapper.show(computedPane.element);

            this.sidebarPaneView.addEventListener(WebInspector.TabbedPane.EventTypes.TabSelected, tabSelected, this);
            this.sidebarPaneView.addPane(stylesPane);
            this.sidebarPaneView.addPane(computedPane);
        }

        this.sidebarPanes.styles.show(matchedStylePanesWrapper.element);
        this.sidebarPanes.computedStyle.show(computedStylePanesWrapper.element);
        showMetrics.call(this, horizontally);
        this.sidebarPanes.platformFonts.show(computedStylePanesWrapper.element);

        this.sidebarPaneView.addPane(this.sidebarPanes.eventListeners);
        this.sidebarPaneView.addPane(this.sidebarPanes.domBreakpoints);
        this.sidebarPaneView.addPane(this.sidebarPanes.properties);

        for (var sidebarViewWrapper of this._elementsSidebarViewWrappers)
            this.sidebarPaneView.addPane(sidebarViewWrapper);

        this._extensionSidebarPanesContainer = this.sidebarPaneView;

        for (var i = 0; i < extensionSidebarPanes.length; ++i)
            this._addExtensionSidebarPane(extensionSidebarPanes[i]);

        this._splitWidget.setSidebarWidget(this.sidebarPaneView);
        this.sidebarPanes.styles.expand();

        if (selectedTabId)
            this.sidebarPaneView.selectTab(selectedTabId);
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _extensionSidebarPaneAdded: function(event)
    {
        var pane = /** @type {!WebInspector.ExtensionSidebarPane} */ (event.data);
        this._addExtensionSidebarPane(pane);
    },

    /**
     * @param {!WebInspector.ExtensionSidebarPane} pane
     */
    _addExtensionSidebarPane: function(pane)
    {
        if (pane.panelName() === this.name)
            this._extensionSidebarPanesContainer.addPane(pane);
    },

    __proto__: WebInspector.Panel.prototype
}

/**
 * @constructor
 * @implements {WebInspector.ContextMenu.Provider}
 */
WebInspector.ElementsPanel.ContextMenuProvider = function()
{
}

WebInspector.ElementsPanel.ContextMenuProvider.prototype = {
    /**
     * @override
     * @param {!Event} event
     * @param {!WebInspector.ContextMenu} contextMenu
     * @param {!Object} target
     */
    appendApplicableItems: function(event, contextMenu, target)
    {
        WebInspector.ElementsPanel.instance().appendApplicableItems(event, contextMenu, target);
    }
}

/**
 * @constructor
 * @implements {WebInspector.Revealer}
 */
WebInspector.ElementsPanel.DOMNodeRevealer = function()
{
}

WebInspector.ElementsPanel.DOMNodeRevealer.prototype = {
    /**
     * @override
     * @param {!Object} node
     * @return {!Promise}
     */
    reveal: function(node)
    {
        var panel = WebInspector.ElementsPanel.instance();
        panel._pendingNodeReveal = true;

        return new Promise(revealPromise);

        /**
         * @param {function(undefined)} resolve
         * @param {function(!Error)} reject
         */
        function revealPromise(resolve, reject)
        {
            if (node instanceof WebInspector.DOMNode) {
                onNodeResolved(/** @type {!WebInspector.DOMNode} */ (node));
            } else if (node instanceof WebInspector.DeferredDOMNode) {
                (/** @type {!WebInspector.DeferredDOMNode} */ (node)).resolve(onNodeResolved);
            } else if (node instanceof WebInspector.RemoteObject) {
                var domModel = WebInspector.DOMModel.fromTarget(/** @type {!WebInspector.RemoteObject} */ (node).target());
                if (domModel)
                    domModel.pushObjectAsNodeToFrontend(node, onNodeResolved);
                else
                    reject(new Error("Could not resolve a node to reveal."));
            } else {
                reject(new Error("Can't reveal a non-node."));
                panel._pendingNodeReveal = false;
            }

            /**
             * @param {?WebInspector.DOMNode} resolvedNode
             */
            function onNodeResolved(resolvedNode)
            {
                panel._pendingNodeReveal = false;

                if (resolvedNode) {
                    panel.revealAndSelectNode(resolvedNode);
                    resolve(undefined);
                    return;
                }
                reject(new Error("Could not resolve node to reveal."));
            }
        }
    }
}

WebInspector.ElementsPanel.show = function()
{
    WebInspector.inspectorView.setCurrentPanel(WebInspector.ElementsPanel.instance());
}

/**
 * @return {!WebInspector.ElementsPanel}
 */
WebInspector.ElementsPanel.instance = function()
{
    if (!WebInspector.ElementsPanel._instanceObject)
        WebInspector.ElementsPanel._instanceObject = new WebInspector.ElementsPanel();
    return WebInspector.ElementsPanel._instanceObject;
}

/**
 * @constructor
 * @implements {WebInspector.PanelFactory}
 */
WebInspector.ElementsPanelFactory = function()
{
}

WebInspector.ElementsPanelFactory.prototype = {
    /**
     * @override
     * @return {!WebInspector.Panel}
     */
    createPanel: function()
    {
        return WebInspector.ElementsPanel.instance();
    }
}

/**
 * @constructor
 * @implements {WebInspector.ActionDelegate}
 */
WebInspector.ElementsActionDelegate = function() { }

WebInspector.ElementsActionDelegate.prototype = {
    /**
     * @override
     * @param {!WebInspector.Context} context
     * @param {string} actionId
     * @return {boolean}
     */
    handleAction: function(context, actionId)
    {
        switch (actionId) {
        case "elements.hide-element":
            WebInspector.ElementsPanel.instance()._toggleHideElement();
            return true;
        case "elements.edit-as-html":
            WebInspector.ElementsPanel.instance()._toggleEditAsHTML();
            return true;
        }
        return false;
    }
}

/**
 * @constructor
 * @implements {WebInspector.DOMPresentationUtils.MarkerDecorator}
 */
WebInspector.ElementsPanel.PseudoStateMarkerDecorator = function()
{
}

WebInspector.ElementsPanel.PseudoStateMarkerDecorator.prototype = {
    /**
     * @override
     * @param {!WebInspector.DOMNode} node
     * @return {?{title: string, color: string}}
     */
    decorate: function(node)
    {
        return { color: "orange", title: WebInspector.UIString("Element state: %s", ":" + WebInspector.CSSStyleModel.fromNode(node).pseudoState(node).join(", :")) };
    }
}

/**
 * @constructor
 * @extends {WebInspector.ThrottledWidget}
 * @param {!WebInspector.ToolbarItem} toolbarItem
 */
WebInspector.ElementsPanel.BaseToolbarPaneWidget = function(toolbarItem)
{
    WebInspector.ThrottledWidget.call(this);
    this._toolbarItem = toolbarItem;
    WebInspector.context.addFlavorChangeListener(WebInspector.DOMNode, this._nodeChanged, this);
}

WebInspector.ElementsPanel.BaseToolbarPaneWidget.prototype = {
    _nodeChanged: function()
    {
        if (!this.isShowing())
            return;

        var elementNode = WebInspector.SharedSidebarModel.elementNode(WebInspector.context.flavor(WebInspector.DOMNode));
        this.onNodeChanged(elementNode);
    },

    /**
     * @param {?WebInspector.DOMNode} newNode
     * @protected
     */
    onNodeChanged: function(newNode)
    {
    },

    /**
     * @override
     */
    willHide: function()
    {
        this._toolbarItem.setToggled(false);
        WebInspector.ThrottledWidget.prototype.willHide.call(this);
    },

    /**
     * @override
     */
    wasShown: function()
    {
        this._toolbarItem.setToggled(true);
        this._nodeChanged();
        WebInspector.ThrottledWidget.prototype.wasShown.call(this);
    },

    __proto__: WebInspector.ThrottledWidget.prototype
}
;/* ClassesPaneWidget.js */
// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @constructor
 * @extends {WebInspector.ElementsPanel.BaseToolbarPaneWidget}
 * @param {!WebInspector.ToolbarItem} toolbarItem
 */
WebInspector.ClassesPaneWidget = function(toolbarItem)
{
    WebInspector.ElementsPanel.BaseToolbarPaneWidget.call(this, toolbarItem);
    this.element.className = "styles-element-classes-pane";
    var container = this.element.createChild("div", "title-container");
    var input = container.createChild("input", "new-class-input monospace");
    input.placeholder = WebInspector.UIString("Add new class");
    input.addEventListener("keydown", this._onKeyDown.bind(this), false);
    this.setDefaultFocusedElement(input);
    this._classesContainer = this.element.createChild("div", "source-code");
    this._classesContainer.classList.add("styles-element-classes-container");

    WebInspector.targetManager.addModelListener(WebInspector.DOMModel, WebInspector.DOMModel.Events.DOMMutated, this._onDOMMutated, this);
    /** @type {!Set<!WebInspector.DOMNode>} */
    this._mutatingNodes = new Set();
}

WebInspector.ClassesPaneWidget._classesSymbol = Symbol("WebInspector.ClassesPaneWidget._classesSymbol");

WebInspector.ClassesPaneWidget.prototype = {
    /**
     * @param {!Event} event
     */
    _onKeyDown: function(event)
    {
        var text = event.target.value;
        if (isEscKey(event)) {
            event.target.value = "";
            if (!text.isWhitespace())
                event.consume(true);
            return;
        }

        if (!isEnterKey(event))
            return;
        var node = WebInspector.context.flavor(WebInspector.DOMNode);
        if (!node)
            return;

        event.target.value = "";
        var classNames = text.split(/[.,\s]/);
        for (var className of classNames) {
            var className = className.trim();
            if (!className.length)
                continue;
            this._toggleClass(node, className, true);
        }
        this._installNodeClasses(node);
        this.update();
        event.consume(true);
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _onDOMMutated: function(event)
    {
        var node = /** @type {!WebInspector.DOMNode} */(event.data);
        if (this._mutatingNodes.has(node))
            return;
        delete node[WebInspector.ClassesPaneWidget._classesSymbol];
        this.update();
    },

    /**
     * @override
     * @return {!Promise.<?>}
     */
    doUpdate: function()
    {
        this._classesContainer.removeChildren();
        var node = WebInspector.context.flavor(WebInspector.DOMNode);
        if (!node)
            return Promise.resolve();

        var classes = this._nodeClasses(node);
        var keys = classes.keysArray();
        keys.sort(String.caseInsensetiveComparator);
        for (var i = 0; i < keys.length; ++i) {
            var className = keys[i];
            var label = createCheckboxLabel(className, classes.get(className));
            label.classList.add("monospace");
            label.checkboxElement.addEventListener("click", this._onClick.bind(this, className), false);
            this._classesContainer.appendChild(label);
        }
        return Promise.resolve();
    },

    /**
     * @param {string} className
     * @param {!Event} event
     */
    _onClick: function(className, event)
    {
        var node = WebInspector.context.flavor(WebInspector.DOMNode);
        if (!node)
            return;
        var enabled = event.target.checked;
        this._toggleClass(node, className, enabled);
        this._installNodeClasses(node);
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @return {!Map<string, boolean>}
     */
    _nodeClasses: function(node)
    {
        var result = node[WebInspector.ClassesPaneWidget._classesSymbol];
        if (!result) {
            var classAttribute = node.getAttribute("class") || "";
            var classes = classAttribute.split(/\s/);
            result = new Map();
            for (var i = 0; i < classes.length; ++i) {
                var className = classes[i].trim();
                if (!className.length)
                    continue;
                result.set(className, true);
            }
            node[WebInspector.ClassesPaneWidget._classesSymbol] = result;
        }
        return result;
    },

    /**
     * @param {!WebInspector.DOMNode} node
     * @param {string} className
     * @param {boolean} enabled
     */
    _toggleClass: function(node, className, enabled)
    {
        var classes = this._nodeClasses(node);
        classes.set(className, enabled);
    },

    /**
     * @param {!WebInspector.DOMNode} node
     */
    _installNodeClasses: function(node)
    {
        var classes = this._nodeClasses(node);
        var activeClasses = new Set();
        for (var className of classes.keys()) {
            if (classes.get(className))
                activeClasses.add(className);
        }

        var newClasses = activeClasses.valuesArray();
        newClasses.sort();
        this._mutatingNodes.add(node);
        node.setAttributeValue("class", newClasses.join(" "), onClassNameUpdated.bind(this));

        /**
         * @this {WebInspector.ClassesPaneWidget}
         */
        function onClassNameUpdated()
        {
            this._mutatingNodes.delete(node);
        }
    },

    /**
     * @override
     * @param {?WebInspector.DOMNode} newNode
     */
    onNodeChanged: function(newNode)
    {
        this.update();
    },

    __proto__: WebInspector.ElementsPanel.BaseToolbarPaneWidget.prototype
}

/**
 * @constructor
 * @implements {WebInspector.ToolbarItem.Provider}
 */
WebInspector.ClassesPaneWidget.ButtonProvider = function()
{
    this._button = new WebInspector.ToolbarToggle(WebInspector.UIString("Element Classes"), "");
    this._button.setText(".cls");
    this._button.element.classList.add("monospace");
    this._button.addEventListener("click", this._clicked, this);
    this._view = new WebInspector.ClassesPaneWidget(this.item());
    WebInspector.context.addFlavorChangeListener(WebInspector.DOMNode, this._nodeChanged, this);
    this._nodeChanged();
}

WebInspector.ClassesPaneWidget.ButtonProvider.prototype = {
    _clicked: function()
    {
        WebInspector.ElementsPanel.instance().showToolbarPane(!this._view.isShowing() ? this._view : null);
    },

    /**
     * @override
     * @return {!WebInspector.ToolbarItem}
     */
    item: function()
    {
        return this._button;
    },

    _nodeChanged: function()
    {
        var node = WebInspector.context.flavor(WebInspector.DOMNode);
        var enabled = !!node;
        this._button.setEnabled(enabled);
        if (!enabled && this._button.toggled())
            WebInspector.ElementsPanel.instance().showToolbarPane(null);
    }
}
;/* ElementStatePaneWidget.js */
// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @constructor
 * @extends {WebInspector.ElementsPanel.BaseToolbarPaneWidget}
 * @param {!WebInspector.ToolbarItem} toolbarItem
 */
WebInspector.ElementStatePaneWidget = function(toolbarItem)
{
    WebInspector.ElementsPanel.BaseToolbarPaneWidget.call(this, toolbarItem);
    this.element.className = "styles-element-state-pane";
    this.element.createChild("div").createTextChild(WebInspector.UIString("Force element state"));
    var table = createElementWithClass("table", "source-code");

    var inputs = [];
    this._inputs = inputs;

    /**
     * @param {!Event} event
     */
    function clickListener(event)
    {
        var node = WebInspector.context.flavor(WebInspector.DOMNode);
        if (!node)
            return;
        WebInspector.CSSStyleModel.fromNode(node).forcePseudoState(node, event.target.state, event.target.checked);
    }

    /**
     * @param {string} state
     * @return {!Element}
     */
    function createCheckbox(state)
    {
        var td = createElement("td");
        var label = createCheckboxLabel(":" + state);
        var input = label.checkboxElement;
        input.state = state;
        input.addEventListener("click", clickListener, false);
        inputs.push(input);
        td.appendChild(label);
        return td;
    }

    var tr = table.createChild("tr");
    tr.appendChild(createCheckbox.call(null, "active"));
    tr.appendChild(createCheckbox.call(null, "hover"));

    tr = table.createChild("tr");
    tr.appendChild(createCheckbox.call(null, "focus"));
    tr.appendChild(createCheckbox.call(null, "visited"));

    this.element.appendChild(table);
}

WebInspector.ElementStatePaneWidget.prototype = {
    /**
     * @param {?WebInspector.Target} target
     */
    _updateTarget: function(target)
    {
        if (this._target === target)
            return;

        if (this._target) {
            var cssModel = WebInspector.CSSStyleModel.fromTarget(this._target);
            cssModel.removeEventListener(WebInspector.CSSStyleModel.Events.PseudoStateForced, this._pseudoStateForced, this)
        }
        this._target = target;
        if (target) {
            var cssModel = WebInspector.CSSStyleModel.fromTarget(target);
            cssModel.addEventListener(WebInspector.CSSStyleModel.Events.PseudoStateForced, this._pseudoStateForced, this)
        }
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _pseudoStateForced: function(event)
    {
        this.update();
    },

    /**
     * @override
     * @param {?WebInspector.DOMNode} newNode
     */
    onNodeChanged: function(newNode)
    {
        this._updateTarget(newNode? newNode.target() : null);
        this.update();
    },

    /**
     * @override
     * @return {!Promise.<?>}
     */
    doUpdate: function()
    {
        var node = WebInspector.context.flavor(WebInspector.DOMNode);
        if (node) {
            var nodePseudoState = WebInspector.CSSStyleModel.fromNode(node).pseudoState(node);
            for (var input of this._inputs) {
                input.disabled = !!node.pseudoType();
                input.checked = nodePseudoState.indexOf(input.state) >= 0;
            }
        } else {
            for (var input of this._inputs) {
                input.disabled = true;
                input.checked = false;
            }
        }
        return Promise.resolve();
    },

    __proto__: WebInspector.ElementsPanel.BaseToolbarPaneWidget.prototype
}

/**
 * @constructor
 * @implements {WebInspector.ToolbarItem.Provider}
 */
WebInspector.ElementStatePaneWidget.ButtonProvider = function()
{
    this._button = new WebInspector.ToolbarToggle(WebInspector.UIString("Toggle Element State"), "", WebInspector.UIString(":hov"));
    this._button.addEventListener("click", this._clicked, this);
    this._button.element.classList.add("monospace");
    this._view = new WebInspector.ElementStatePaneWidget(this.item());
    WebInspector.context.addFlavorChangeListener(WebInspector.DOMNode, this._nodeChanged, this);
    this._nodeChanged();
}

WebInspector.ElementStatePaneWidget.ButtonProvider.prototype = {
    _clicked: function()
    {
        WebInspector.ElementsPanel.instance().showToolbarPane(!this._view.isShowing() ? this._view : null);
    },

    /**
     * @override
     * @return {!WebInspector.ToolbarItem}
     */
    item: function()
    {
        return this._button;
    },

    _nodeChanged: function()
    {
        var enabled = !!WebInspector.context.flavor(WebInspector.DOMNode);
        this._button.setEnabled(enabled);
        if (!enabled && this._button.toggled())
            WebInspector.ElementsPanel.instance().showToolbarPane(null);
    }
}
;/* ElementsTreeElementHighlighter.js */
// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @constructor
 * @param {!WebInspector.ElementsTreeOutline} treeOutline
 */
WebInspector.ElementsTreeElementHighlighter = function(treeOutline)
{
    this._throttler = new WebInspector.Throttler(100);
    this._treeOutline = treeOutline;
    this._treeOutline.addEventListener(TreeOutline.Events.ElementExpanded, this._clearState, this);
    this._treeOutline.addEventListener(TreeOutline.Events.ElementCollapsed, this._clearState, this);
    this._treeOutline.addEventListener(WebInspector.ElementsTreeOutline.Events.SelectedNodeChanged, this._clearState, this);
    WebInspector.targetManager.addModelListener(WebInspector.DOMModel, WebInspector.DOMModel.Events.NodeHighlightedInOverlay, this._highlightNode, this);
    this._treeOutline.domModel().addEventListener(WebInspector.DOMModel.Events.InspectModeWillBeToggled, this._clearState, this);
}

WebInspector.ElementsTreeElementHighlighter.prototype = {
    /**
     * @param {!WebInspector.Event} event
     */
    _highlightNode: function(event)
    {
        if (!WebInspector.moduleSetting("highlightNodeOnHoverInOverlay").get())
            return;

        var domNode = /** @type {!WebInspector.DOMNode} */ (event.data);

        this._throttler.schedule(callback.bind(this));
        this._pendingHighlightNode = this._treeOutline.domModel() === domNode.domModel() ? domNode : null;

        /**
         * @this {WebInspector.ElementsTreeElementHighlighter}
         */
        function callback()
        {
            this._highlightNodeInternal(this._pendingHighlightNode);
            delete this._pendingHighlightNode;
            return Promise.resolve();
        }
    },

    /**
     * @param {?WebInspector.DOMNode} node
     */
    _highlightNodeInternal: function(node)
    {
        this._isModifyingTreeOutline = true;
        var treeElement = null;

        if (this._currentHighlightedElement) {
            var currentTreeElement = this._currentHighlightedElement;
            while (currentTreeElement !== this._alreadyExpandedParentElement) {
                if (currentTreeElement.expanded)
                    currentTreeElement.collapse();

                currentTreeElement = currentTreeElement.parent;
            }
        }

        delete this._currentHighlightedElement;
        delete this._alreadyExpandedParentElement;
        if (node) {
            var deepestExpandedParent = node;
            var treeElementSymbol = this._treeOutline.treeElementSymbol();
            while (deepestExpandedParent && (!deepestExpandedParent[treeElementSymbol] || !deepestExpandedParent[treeElementSymbol].expanded))
                deepestExpandedParent = deepestExpandedParent.parentNode;

            this._alreadyExpandedParentElement = deepestExpandedParent ? deepestExpandedParent[treeElementSymbol] : this._treeOutline.rootElement();
            treeElement = this._treeOutline.createTreeElementFor(node);
        }

        this._currentHighlightedElement = treeElement;
        this._treeOutline.setHoverEffect(treeElement);
        if (treeElement)
            treeElement.reveal();

        this._isModifyingTreeOutline = false;
    },

    _clearState: function()
    {
        if (this._isModifyingTreeOutline)
            return;

        delete this._currentHighlightedElement;
        delete this._alreadyExpandedParentElement;
        delete this._pendingHighlightNode;
    }

};Runtime.cachedResources["elements/bezierEditor.css"] = "/*\n * Copyright (c) 2015 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n:host {\n    width: 270px;\n    height: 350px;\n    -webkit-user-select: none;\n    padding: 16px;\n    overflow: hidden;\n}\n\n.bezier-preset-selected > svg {\n    background-color: rgb(56, 121, 217);\n}\n\n.bezier-preset-label {\n    font-size: 10px;\n}\n\n.bezier-preset {\n    width: 50px;\n    height: 50px;\n    padding: 5px;\n    margin: auto;\n    background-color: #f5f5f5;\n    border-radius: 3px;\n}\n\n.bezier-preset line.bezier-control-line {\n    stroke: #666;\n    stroke-width: 1;\n    stroke-linecap: round;\n    fill: none;\n}\n\n.bezier-preset circle.bezier-control-circle {\n    fill: #666;\n}\n\n.bezier-preset path.bezier-path {\n    stroke: black;\n    stroke-width: 2;\n    stroke-linecap: round;\n    fill: none;\n}\n\n.bezier-preset-selected path.bezier-path, .bezier-preset-selected line.bezier-control-line {\n    stroke: white;\n}\n\n.bezier-preset-selected circle.bezier-control-circle {\n    fill: white;\n}\n\n.bezier-curve line.linear-line {\n    stroke: #eee;\n    stroke-width: 2;\n    stroke-linecap: round;\n    fill: none;\n}\n\n.bezier-curve line.bezier-control-line {\n    stroke: #9C27B0;\n    stroke-width: 2;\n    stroke-linecap: round;\n    fill: none;\n    opacity: 0.6;\n}\n\n.bezier-curve circle.bezier-control-circle {\n    fill: #9C27B0;\n    cursor: pointer;\n}\n\n.bezier-curve path.bezier-path {\n    stroke: black;\n    stroke-width: 3;\n    stroke-linecap: round;\n    fill: none;\n}\n\n.bezier-preview-container {\n    position: relative;\n    background-color: white;\n    overflow: hidden;\n    border-radius: 20px;\n    width: 200%;\n    height: 20px;\n    z-index: 2;\n    flex-shrink: 0;\n    opacity: 0;\n}\n\n.bezier-preview-animation {\n    background-color: #9C27B0;\n    width: 20px;\n    height: 20px;\n    border-radius: 20px;\n    position: absolute;\n}\n\n.bezier-preview-onion {\n    margin-top: -20px;\n    position: relative;\n    z-index: 1;\n}\n\n.bezier-preview-onion > .bezier-preview-animation {\n    opacity: 0.1;\n}\n\nsvg.bezier-preset-modify {\n    background-color: #f5f5f5;\n    border-radius: 35px;\n    display: inline-block;\n    visibility: hidden;\n    transition: transform 100ms cubic-bezier(0.4, 0, 0.2, 1);\n    cursor: pointer;\n    position: absolute;\n}\n\nsvg.bezier-preset-modify:hover, .bezier-preset:hover {\n    background-color: #999;\n}\n\n.bezier-preset-selected .bezier-preset:hover {\n    background-color: rgb(56, 121, 217);\n}\n\n.bezier-preset-modify path {\n    stroke-width: 2;\n    stroke: black;\n    fill: none;\n}\n\n.bezier-preset-selected .bezier-preset-modify {\n    opacity: 1;\n}\n\n.bezier-preset-category {\n    width: 50px;\n    margin: 20px 0;\n    cursor: pointer;\n    transition: transform 100ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n\nspan.bezier-display-value {\n    width: 100%;\n    -webkit-user-select: text;\n    display: block;\n    text-align: center;\n    line-height: 20px;\n    height: 20px;\n    cursor: text;\n    white-space: nowrap !important;\n}\n\n.bezier-container {\n    display: flex;\n    margin-top: 38px;\n}\n\nsvg.bezier-curve {\n    margin-left: 32px;\n    margin-top: -8px;\n}\n\nsvg.bezier-preset-modify.bezier-preset-plus {\n    right: 0;\n}\n\n.bezier-header {\n    margin-top: 16px;\n}\n\nsvg.bezier-preset-modify:active,\n.-theme-selection-color {\n    transform: scale(1.1);\n    background-color: rgb(56, 121, 217);\n}\n\n.bezier-preset-category:active {\n    transform: scale(1.05);\n}\n\n.bezier-header-active > svg.bezier-preset-modify {\n    visibility: visible;\n}\n\n.bezier-preset-modify:active path {\n    stroke: white;\n}\n\n/*# sourceURL=elements/bezierEditor.css */";
Runtime.cachedResources["elements/breadcrumbs.css"] = "/*\n * Copyright 2014 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.crumbs {\n    display: inline-block;\n    pointer-events: auto;\n    cursor: default;\n    font-size: 11px;\n    line-height: 17px;\n    white-space: nowrap;\n}\n\n.crumbs .crumb {\n    display: inline-block;\n    padding: 0 7px;\n    height: 18px;\n    white-space: nowrap;\n}\n\n.crumbs .crumb.collapsed > * {\n    display: none;\n}\n\n.crumbs .crumb.collapsed::before {\n    content: \"\\2026\";\n    font-weight: bold;\n}\n\n.crumbs .crumb.compact .extra {\n    display: none;\n}\n\n.crumbs .crumb.selected, .crumbs .crumb.selected:hover {\n    background-color: rgb(56, 121, 217);\n    color: white;\n    text-shadow: rgba(255, 255, 255, 0.5) 0 0 0;\n}\n\n.crumbs .crumb:hover {\n    background-color: rgb(216, 216, 216);\n}\n\n/*# sourceURL=elements/breadcrumbs.css */";
Runtime.cachedResources["elements/computedStyleSidebarPane.css"] = "/*\n * Copyright (c) 2015 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.computed-properties {\n    -webkit-user-select: text;\n}\n\n.computed-style-property {\n    display: flex;\n    overflow: hidden;\n    flex: auto;\n}\n\n.computed-style-property .property-name {\n    min-width: 5em;\n    text-overflow: ellipsis;\n    overflow: hidden;\n    flex-shrink: 1;\n    flex-basis: 16em;\n    flex-grow: 1;\n}\n\n.computed-style-property .property-value {\n    margin-left: 2em;\n    position: relative;\n    display: flex;\n    flex-shrink: 0;\n    flex-basis: 5em;\n    flex-grow: 10;\n}\n\n.computed-style-property .property-value-text {\n    overflow: hidden;\n    text-overflow: ellipsis;\n}\n\n.tree-outline li:hover .goto-source-icon {\n    display: block;\n}\n\n.goto-source-icon {\n    -webkit-mask-image: url(Images/toolbarButtonGlyphs.png);\n    -webkit-mask-position: 0 -120px;\n    background-color: #5a5a5a;\n    width: 28px;\n    height: 24px;\n    display: none;\n    position: absolute;\n    top: -6px;\n    left: -27px;\n}\n\n.goto-source-icon:hover {\n    background-color: #333;\n}\n\n.computed-style-property-inherited {\n    opacity: 0.5;\n}\n\n.trace-link {\n    float: right;\n    padding-left: 1em;\n    position: relative;\n    z-index: 1;\n}\n\n.trace-link a::before {\n    content: attr(data-uncopyable);\n    text-decoration: underline;\n}\n\n.property-trace {\n    text-overflow: ellipsis;\n    overflow: hidden;\n    flex-grow: 1;\n}\n\n.property-trace-selector {\n    color: gray;\n    padding-left: 2em;\n}\n\n.property-trace-value {\n    position: relative;\n    display: inline-block;\n    margin-left: 2em;\n}\n\n.property-trace-inactive .property-trace-value::before {\n    position: absolute;\n    content: \".\";\n    border-bottom: 1px solid rgba(0, 0, 0, 0.35);\n    top: 0;\n    bottom: 5px;\n    left: 0;\n    right: 0;\n}\n\n.tree-outline li.odd-row {\n    position: relative;\n    background-color: #F5F5F5;\n}\n\n.tree-outline, .tree-outline ol {\n    padding-left: 0;\n}\n\n.tree-outline li:hover {\n    background-color: rgb(235, 242, 252);\n    cursor: pointer;\n}\n\n.tree-outline li::before {\n    margin-left: 4px;\n}\n\n.delimeter {\n    color: transparent;\n}\n\n.delimeter::selection {\n    color: transparent;\n}\n\n/*# sourceURL=elements/computedStyleSidebarPane.css */";
Runtime.cachedResources["elements/elementsPanel.css"] = "/*\n * Copyright (C) 2006, 2007, 2008 Apple Inc.  All rights reserved.\n * Copyright (C) 2009 Anthony Ricaud <rik@webkit.org>\n *\n * Redistribution and use in source and binary forms, with or without\n * modification, are permitted provided that the following conditions\n * are met:\n *\n * 1.  Redistributions of source code must retain the above copyright\n *     notice, this list of conditions and the following disclaimer.\n * 2.  Redistributions in binary form must reproduce the above copyright\n *     notice, this list of conditions and the following disclaimer in the\n *     documentation and/or other materials provided with the distribution.\n * 3.  Neither the name of Apple Computer, Inc. (\"Apple\") nor the names of\n *     its contributors may be used to endorse or promote products derived\n *     from this software without specific prior written permission.\n *\n * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS \"AS IS\" AND ANY\n * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED\n * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE\n * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY\n * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES\n * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;\n * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND\n * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF\n * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n */\n\n#elements-content {\n    flex: 1 1;\n    overflow: auto;\n    padding: 2px 0 0 0;\n}\n\n#elements-content:not(.elements-wrap) > div {\n    display: inline-block;\n    min-width: 100%;\n}\n\n#elements-content.elements-wrap {\n    overflow-x: hidden;\n}\n\n.elements-topbar {\n    border-bottom: 1px solid hsla(0, 0%, 0%, 0.1);\n    flex-shrink: 0;\n}\n\n#elements-crumbs {\n    flex: 0 0 19px;\n    background-color: white;\n    border-top: 1px solid #ccc;\n    overflow: hidden;\n    height: 19px;\n    width: 100%;\n}\n\n.metrics {\n    padding: 8px;\n    font-size: 10px;\n    text-align: center;\n    white-space: nowrap;\n}\n\n.metrics .label {\n    position: absolute;\n    font-size: 10px;\n    margin-left: 3px;\n    padding-left: 2px;\n    padding-right: 2px;\n}\n\n.metrics .position {\n    border: 1px rgb(66%, 66%, 66%) dotted;\n    background-color: white;\n    display: inline-block;\n    text-align: center;\n    padding: 3px;\n    margin: 3px;\n}\n\n.metrics .margin {\n    border: 1px dashed;\n    background-color: white;\n    display: inline-block;\n    text-align: center;\n    vertical-align: middle;\n    padding: 3px;\n    margin: 3px;\n}\n\n.metrics .border {\n    border: 1px black solid;\n    background-color: white;\n    display: inline-block;\n    text-align: center;\n    vertical-align: middle;\n    padding: 3px;\n    margin: 3px;\n}\n\n.metrics .padding {\n    border: 1px grey dashed;\n    background-color: white;\n    display: inline-block;\n    text-align: center;\n    vertical-align: middle;\n    padding: 3px;\n    margin: 3px;\n}\n\n.metrics .content {\n    position: static;\n    border: 1px gray solid;\n    background-color: white;\n    display: inline-block;\n    text-align: center;\n    vertical-align: middle;\n    padding: 3px;\n    margin: 3px;\n    min-width: 80px;\n    overflow: visible;\n}\n\n.metrics .content span {\n    display: inline-block;\n}\n\n.metrics .editing {\n    position: relative;\n    z-index: 100;\n    cursor: text;\n}\n\n.metrics .left {\n    display: inline-block;\n    vertical-align: middle;\n}\n\n.metrics .right {\n    display: inline-block;\n    vertical-align: middle;\n}\n\n.metrics .top {\n    display: inline-block;\n}\n\n.metrics .bottom {\n    display: inline-block;\n}\n\n.styles-section {\n    padding: 2px 2px 4px 4px;\n    min-height: 18px;\n    white-space: nowrap;\n    background-origin: padding;\n    background-clip: padding;\n    -webkit-user-select: text;\n    border-bottom: 1px solid #eee;\n    position: relative;\n    overflow: hidden;\n}\n\n.styles-section:last-child {\n    border-bottom: none;\n}\n\n.styles-pane .sidebar-separator {\n    border-top: 0 none;\n}\n\n.styles-section.read-only {\n    background-color: #eee;\n}\n\n.styles-section .style-properties li.not-parsed-ok {\n    margin-left: 0;\n}\n\n.styles-filter-engaged,\n.styles-section .style-properties li.filter-match,\n.styles-section .simple-selector.filter-match {\n    background-color: rgba(255, 255, 0, 0.5);\n}\n\n.-theme-with-dark-background .styles-filter-engaged,\n.-theme-with-dark-background .styles-section .style-properties li.filter-match,\n.-theme-with-dark-background .styles-section .simple-selector.filter-match {\n    background-color: hsla(133, 100%, 30%, 0.5);\n}\n\n\n.styles-section .style-properties li.overloaded.filter-match {\n    background-color: rgba(255, 255, 0, 0.25);\n}\n\n.-theme-with-dark-background .styles-section .style-properties li.overloaded.filter-match {\n    background-color: hsla(133, 100%, 30%, 0.25);\n}\n\n.styles-section .style-properties li.not-parsed-ok .exclamation-mark {\n    display: inline-block;\n    position: relative;\n    width: 11px;\n    height: 10px;\n    margin: 0 7px 0 0;\n    top: 1px;\n    left: -36px; /* outdent to compensate for the top-level property indent */\n    -webkit-user-select: none;\n    cursor: default;\n    z-index: 1;\n}\n\n.styles-section .sidebar-pane-closing-brace {\n    clear: both;\n}\n\n.styles-section-title {\n    background-origin: padding;\n    background-clip: padding;\n    word-wrap: break-word;\n    white-space: normal;\n}\n\n.styles-section-title .media-list {\n    color: #888;\n}\n\n.styles-section-title .media-list.media-matches .media.editable-media {\n    color: #222;\n}\n\n.styles-section-title .media:not(.editing-media),\n.styles-section-title .media:not(.editing-media) .subtitle {\n    overflow: hidden;\n}\n\n.styles-section-title .media .subtitle {\n    float: right;\n    color: rgb(85, 85, 85);\n}\n\n.styles-section-subtitle {\n    color: rgb(85, 85, 85);\n    float: right;\n    margin-left: 5px;\n    max-width: 100%;\n    text-overflow: ellipsis;\n    overflow: hidden;\n    white-space: nowrap;\n}\n\n.styles-section .styles-section-subtitle a {\n    color: inherit;\n}\n\n.styles-section .selector {\n    color: #888;\n}\n\n.styles-section .simple-selector.selector-matches, .styles-section.keyframe-key {\n    color: #222;\n}\n\n.styles-section a[data-uncopyable] {\n    display: inline-block;\n}\n\n.styles-section a[data-uncopyable]::before {\n    content: attr(data-uncopyable);\n    text-decoration: underline;\n}\n\n.styles-section .style-properties {\n    margin: 0;\n    padding: 2px 4px 0 0;\n    list-style: none;\n    clear: both;\n}\n\n.styles-section.matched-styles .style-properties {\n    padding-left: 0;\n}\n\n.no-affect .style-properties li {\n    opacity: 0.5;\n}\n\n.no-affect .style-properties li.editing {\n    opacity: 1.0;\n}\n\n.styles-section .style-properties li {\n    margin-left: 12px;\n    padding-left: 22px;\n    white-space: normal;\n    text-overflow: ellipsis;\n    overflow: hidden;\n    cursor: auto;\n}\n\n.styles-section .style-properties li .webkit-css-property {\n    margin-left: -22px; /* outdent the first line of longhand properties (in an expanded shorthand) to compensate for the \"padding-left\" shift in .styles-section .style-properties li */\n}\n\n.styles-section .style-properties > li {\n    padding-left: 38px;\n    clear: both;\n    min-height: 14px;\n}\n\n.styles-section .style-properties > li .webkit-css-property {\n    margin-left: -38px; /* outdent the first line of the top-level properties to compensate for the \"padding-left\" shift in .styles-section .style-properties > li */\n}\n\n.styles-section .style-properties > li.child-editing {\n    padding-left: 8px;\n}\n\n.styles-section .style-properties > li.child-editing .webkit-css-property {\n    margin-left: 0;\n}\n\n.styles-section.matched-styles .style-properties li {\n    margin-left: 0 !important;\n}\n\n.styles-section .style-properties li.child-editing {\n    word-wrap: break-word !important;\n    white-space: normal !important;\n    padding-left: 0;\n}\n\n.styles-section .style-properties ol {\n    display: none;\n    margin: 0;\n    -webkit-padding-start: 12px;\n    list-style: none;\n}\n\n.styles-section .style-properties ol.expanded {\n    display: block;\n}\n\n.styles-section.matched-styles .style-properties li.parent .expand-element {\n    -webkit-user-select: none;\n    -webkit-mask-image: url(Images/toolbarButtonGlyphs.png);\n    -webkit-mask-size: 352px 168px;\n    margin-right: 2px;\n    margin-left: -6px;\n    background-color: #777;\n    width: 8px;\n    height: 10px;\n    display: inline-block;\n}\n\n@media (-webkit-min-device-pixel-ratio: 1.5) {\n.styles-section.matched-styles .style-properties li.parent .expand-element {\n    -webkit-mask-image: url(Images/toolbarButtonGlyphs_2x.png);\n}\n} /* media */\n\n.styles-section.matched-styles .style-properties li.parent .expand-element {\n    -webkit-mask-position: -4px -96px;\n}\n\n.styles-section.matched-styles .style-properties li.parent.expanded .expand-element {\n    -webkit-mask-position: -20px -96px;\n}\n\n.styles-section .style-properties li .info {\n    padding-top: 4px;\n    padding-bottom: 3px;\n}\n\n.styles-section.matched-styles:not(.read-only):hover .style-properties .enabled-button {\n    visibility: visible;\n}\n\n.styles-section.matched-styles:not(.read-only) .style-properties li.disabled .enabled-button {\n    visibility: visible;\n}\n\n.styles-section .style-properties .enabled-button {\n    visibility: hidden;\n    float: left;\n    font-size: 10px;\n    margin: 0;\n    vertical-align: top;\n    position: relative;\n    z-index: 1;\n    width: 18px;\n    left: -40px; /* original -2px + (-38px) to compensate for the first line outdent */\n    top: 1px;\n    height: 13px;\n}\n\n.styles-section.matched-styles .style-properties ol.expanded {\n    margin-left: 16px;\n}\n\n.styles-section .style-properties .overloaded:not(.has-ignorable-error),\n.styles-section .style-properties .inactive,\n.styles-section .style-properties .disabled,\n.styles-section .style-properties .not-parsed-ok:not(.has-ignorable-error) {\n    text-decoration: line-through;\n}\n\n.styles-section .style-properties .has-ignorable-error .webkit-css-property {\n    color: inherit;\n}\n\n.styles-section .style-properties .implicit,\n.styles-section .style-properties .inherited {\n    opacity: 0.5;\n}\n\n.styles-section .style-properties .has-ignorable-error {\n    color: gray;\n}\n\n.styles-element-state-pane {\n    overflow: hidden;\n    height: 66px;\n    padding-left: 2px;\n    border-bottom: 1px solid rgb(189, 189, 189);\n}\n\n@keyframes styles-element-state-pane-slidein {\n    from {\n        margin-top: -60px;\n    }\n    to {\n        margin-top: 0px;\n    }\n}\n\n@keyframes styles-element-state-pane-slideout {\n    from {\n        margin-top: 0px;\n    }\n    to {\n        margin-top: -60px;\n    }\n}\n\n.styles-sidebar-toolbar-pane {\n    position: relative;\n    animation-duration: 0.1s;\n    animation-direction: normal;\n}\n\n.styles-sidebar-toolbar-pane-container {\n    position: relative;\n    overflow: hidden;\n    flex-shrink: 0;\n}\n\n.styles-element-state-pane {\n    background-color: #f3f3f3;\n    border-bottom: 1px solid rgb(189, 189, 189);\n    margin-top: 0;\n}\n\n.styles-element-classes-pane {\n    background-color: #f3f3f3;\n    border-bottom: 1px solid rgb(189, 189, 189);\n    padding: 6px 2px 2px;\n}\n\n.styles-element-classes-container {\n    display: flex;\n    flex-wrap: wrap;\n    justify-content: flex-start;\n}\n\n.styles-element-classes-pane label {\n    margin-right: 15px;\n}\n\n.styles-element-classes-pane .title-container {\n    padding-bottom: 2px;\n}\n\n.styles-element-classes-pane .new-class-input {\n    padding-left: 3px;\n    border: 1px solid #ddd;\n    line-height: 15px;\n    margin-left: 3px;\n    width: calc(100% - 7px);\n}\n\n.styles-element-state-pane > div {\n    margin: 8px 4px 6px;\n}\n\n.styles-element-state-pane > table {\n    width: 100%;\n    border-spacing: 0;\n}\n\n.styles-element-state-pane td {\n    padding: 0;\n}\n\n.styles-animations-controls-pane > * {\n    margin: 6px 4px;\n}\n\n.styles-animations-controls-pane {\n    border-bottom: 1px solid rgb(189, 189, 189);\n    height: 60px;\n    overflow: hidden;\n    background-color: #eee;\n}\n\n.animations-controls {\n    width: 100%;\n    max-width: 200px;\n    display: flex;\n    align-items: center;\n}\n\n.animations-controls > .toolbar {\n    display: inline-block;\n}\n\n.animations-controls > input {\n    flex-grow: 1;\n    margin-right: 10px;\n}\n\n.animations-controls > .playback-label {\n    width: 35px;\n}\n\n.styles-selector {\n    cursor: text;\n}\n\n.image-preview-container {\n    background: transparent;\n    text-align: center;\n}\n\n.image-preview-container img {\n    margin: 2px auto;\n    max-width: 100px;\n    max-height: 100px;\n    background-image: url(Images/checker.png);\n    -webkit-user-select: text;\n    -webkit-user-drag: auto;\n}\n\n.sidebar-pane.composite {\n    position: absolute;\n}\n\n.metrics {\n    border-bottom: 1px solid #ccc;\n}\n\n.-theme-with-dark-background .metrics {\n    color: #222;\n}\n\n.-theme-with-dark-background .metrics > div:hover {\n    color: #ccc;\n}\n\n.metrics-and-styles .metrics {\n    border-top: 1px solid #ccc;\n    border-bottom: none;\n}\n\n.sidebar-pane.composite .metrics {\n    min-height: 190px;\n    display: flex;\n    flex-direction: column;\n    -webkit-align-items: center;\n    -webkit-justify-content: center;\n}\n\n.sidebar-pane .metrics-and-styles,\n.sidebar-pane .metrics-and-computed {\n    display: flex !important;\n    flex-direction: column !important;\n    position: relative;\n}\n\n.sidebar-pane .style-panes-wrapper {\n    transform: translateZ(0);\n    flex: 1;\n    overflow-y: auto;\n    position: relative;\n}\n\n.styles-sidebar-pane-toolbar-container {\n    flex-shrink: 0;\n    overflow: hidden;\n}\n\n.styles-sidebar-pane-toolbar {\n    border-bottom: 1px solid #eee;\n    flex-shrink: 0;\n}\n\n.styles-sidebar-pane-filter-box {\n    flex: auto;\n    display: flex;\n}\n\n.styles-sidebar-pane-filter-box > input {\n    outline: none !important;\n    border: none;\n    width: 100%;\n    background: transparent;\n    margin-left: 4px;\n}\n\n.sidebar-pane.composite .platform-fonts {\n    -webkit-user-select: text;\n}\n\n.sidebar-pane.composite .platform-fonts .sidebar-separator {\n    height: 24px;\n    background-color: #f1f1f1;\n    border-color: #ddd;\n    display: flex;\n    align-items: center;\n}\n\n.sidebar-pane.composite .platform-fonts .stats-section {\n    margin: 5px 0;\n}\n\n.sidebar-pane.composite .platform-fonts .font-stats-item {\n    padding-left: 1em;\n}\n\n.sidebar-pane.composite .platform-fonts .font-stats-item .delimeter {\n    margin: 0 1ex 0 1ex;\n}\n\n.sidebar-pane.composite .metrics-and-styles .metrics {\n    border-bottom: none;\n}\n\n.sidebar-pane > .split-widget {\n    position: absolute;\n    top: 0;\n    bottom: 0;\n    left: 0;\n    right: 0;\n}\n\n.styles-section:not(.read-only) .style-properties .webkit-css-property.styles-panel-hovered,\n.styles-section:not(.read-only) .style-properties .value .styles-panel-hovered,\n.styles-section:not(.read-only) .style-properties .value.styles-panel-hovered,\n.styles-section:not(.read-only) span.simple-selector.styles-panel-hovered,\n.styles-section:not(.read-only) .media-text.styles-panel-hovered {\n    text-decoration: underline;\n    cursor: default;\n}\n\n.styles-clipboard-only {\n    display: inline-block;\n    width: 0;\n    opacity: 0;\n    pointer-events: none;\n    white-space: pre;\n}\n\n.popover-icon {\n    margin-left: 1px;\n    margin-right: 2px;\n    width: 10px;\n    height: 10px;\n    position: relative;\n    top: 1px;\n    display: inline-block;\n    line-height: 1px;\n    -webkit-user-select: none;\n}\n\n.bezier-icon {\n    background-color: #9C27B0;\n    border-radius: 2px;\n}\n\n.bezier-icon path {\n    stroke: white;\n    stroke-width: 1.5;\n    stroke-linecap: square;\n    fill: none;\n}\n\n.swatch {\n    background-image: url(Images/checker.png);\n}\n\nli.child-editing .styles-clipboard-only {\n    display: none;\n}\n\nli.editing .swatch,\nli.editing .enabled-button {\n    display: none !important;\n}\n\n.sidebar-separator {\n    background-color: #ddd;\n    padding: 0 5px;\n    border-top: 1px solid #ccc;\n    border-bottom: 1px solid #ccc;\n    color: rgb(50, 50, 50);\n    white-space: nowrap;\n    text-overflow: ellipsis;\n    overflow: hidden;\n    line-height: 16px;\n}\n\n.sidebar-separator > span.monospace {\n    background: rgb(255, 255, 255);\n    padding: 0px 3px;\n    border-radius: 2px;\n    border: 1px solid #C1C1C1;\n}\n\n.swatch-inner {\n    width: 100%;\n    height: 100%;\n    display: inline-block;\n    border: 1px solid rgba(128, 128, 128, 0.6);\n}\n\n.swatch-inner:hover {\n    border: 1px solid rgba(64, 64, 64, 0.8);\n}\n\n.animation-section-body {\n    display: none;\n}\n\n.animation-section-body.expanded {\n    display: block;\n}\n\n.animation-section-body .section {\n    border-bottom: 1px solid rgb(191, 191, 191);\n}\n\n.animationsHeader {\n    padding-top: 23px;\n}\n\n.global-animations-toolbar {\n    position: absolute;\n    top: 0;\n    width: 100%;\n    background-color: #eee;\n    border-bottom: 1px solid rgb(163, 163, 163);\n    padding-left: 10px;\n}\n\n.events-pane .section:not(:first-of-type) {\n    border-top: 1px solid rgb(231, 231, 231);\n}\n\n.events-pane .section {\n    margin: 0;\n}\n\n.style-properties li.editing {\n    margin-left: 10px;\n    text-overflow: clip;\n}\n\n.style-properties li.editing-sub-part {\n    padding: 3px 6px 8px 18px;\n    margin: -1px -6px -8px -6px;\n    text-overflow: clip;\n}\n\n.properties-widget-section {\n    padding: 2px 0px 2px 5px;\n}\n\n.sidebar-pane-section-toolbar {\n    position: absolute;\n    right: 0;\n    bottom: 0;\n    visibility: hidden;\n    background-color: rgba(255, 255, 255, 0.9);\n}\n\n.styles-pane:not(.is-editing-style) .styles-section.matched-styles:not(.read-only):hover .sidebar-pane-section-toolbar {\n    visibility: visible;\n}\n\n/*# sourceURL=elements/elementsPanel.css */";
Runtime.cachedResources["elements/elementsTreeOutline.css"] = "/*\n * Copyright (c) 2014 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.elements-disclosure {\n    width: 100%;\n    display: inline-block;\n    line-height: normal;\n}\n\n.elements-disclosure li {\n    /** Keep margin-left & padding-left in sync with ElementsTreeElements.updateDecorators **/\n    padding: 0 0 0 14px;\n    margin-top: 1px;\n    margin-left: -2px;\n    word-wrap: break-word;\n    position: relative;\n    min-height: 14px;\n}\n\n.elements-disclosure li.parent {\n    /** Keep it in sync with ElementsTreeElements.updateDecorators **/\n    margin-left: -13px;\n}\n\n.elements-disclosure li.selected:after {\n    font-style: italic;\n    content: \" == $0\";\n    color: black;\n    opacity: 0.6;\n    position: absolute;\n}\n\n.elements-disclosure ol:focus li.selected:after {\n    color: white;\n}\n\n.elements-disclosure li.parent::before {\n    box-sizing: border-box;\n}\n\n.elements-disclosure li.parent::before {\n    -webkit-user-select: none;\n    -webkit-mask-image: url(Images/toolbarButtonGlyphs.png);\n    -webkit-mask-size: 352px 168px;\n    content: \"aa\";\n    color: transparent;\n    text-shadow: none;\n    margin-right: -3px;\n}\n\n.elements-disclosure li.always-parent::before {\n    visibility: hidden;\n}\n\n@media (-webkit-min-device-pixel-ratio: 1.5) {\n.elements-disclosure li.parent::before {\n    -webkit-mask-image: url(Images/toolbarButtonGlyphs_2x.png);\n}\n} /* media */\n\n.elements-disclosure li.parent::before {\n    -webkit-mask-position: -4px -96px;\n    background-color: rgb(110, 110, 110);\n}\n\n.elements-disclosure li .selection {\n    display: none;\n    z-index: -1;\n    margin-left: -10000px;\n}\n\n.elements-disclosure li.hovered:not(.selected) .selection {\n    display: block;\n    left: 3px;\n    right: 3px;\n    background-color: rgba(56, 121, 217, 0.1);\n    border-radius: 5px;\n}\n\n.elements-disclosure li.parent.expanded::before {\n    -webkit-mask-position: -20px -96px;\n}\n\n.elements-disclosure li.selected .selection {\n    display: block;\n    background-color: #dadada;\n}\n\n.elements-disclosure ol {\n    list-style-type: none;\n    /** Keep it in sync with ElementsTreeElements.updateDecorators **/\n    -webkit-padding-start: 12px;\n    margin: 0;\n}\n\n.elements-disclosure ol.children {\n    display: none;\n}\n\n.elements-disclosure ol.children.expanded {\n    display: block;\n}\n\n.elements-disclosure li .webkit-html-tag.close {\n    margin-left: -12px;\n}\n\n.elements-disclosure > ol {\n    position: relative;\n    margin: 0;\n    cursor: default;\n    min-width: 100%;\n    min-height: 100%;\n    -webkit-transform: translateZ(0);\n    padding-left: 2px;\n}\n\n.elements-disclosure ol:focus li.selected {\n    color: white;\n}\n\n.elements-disclosure ol:focus li.parent.selected::before {\n    background-color: white;\n}\n\n.elements-disclosure ol:focus li.selected * {\n    color: inherit;\n}\n\n.elements-disclosure ol:focus li.selected .selection {\n    background-color: rgb(56, 121, 217);\n}\n\n.elements-tree-outline ol.shadow-root {\n    margin-left: 5px;\n    padding-left: 5px;\n    border-left: 1px solid rgb(190, 190, 190);\n}\n\n.elements-tree-outline ol.shadow-root-depth-4 {\n    background-color: rgba(0, 0, 0, 0.04);\n}\n\n.elements-tree-outline ol.shadow-root-depth-3 {\n    background-color: rgba(0, 0, 0, 0.03);\n}\n\n.elements-tree-outline ol.shadow-root-depth-2 {\n    background-color: rgba(0, 0, 0, 0.02);\n}\n\n.elements-tree-outline ol.shadow-root-depth-1 {\n    background-color: rgba(0, 0, 0, 0.01);\n}\n\n.elements-tree-outline ol.shadow-root-deep {\n    background-color: transparent;\n}\n\n.elements-tree-editor {\n    -webkit-user-select: text;\n    -webkit-user-modify: read-write-plaintext-only;\n}\n\n.elements-disclosure li.elements-drag-over .selection {\n    display: block;\n    margin-top: -2px;\n    border-top: 2px solid rgb(56, 121, 217);\n}\n\n.elements-disclosure li.in-clipboard .highlight {\n    outline: 1px dotted darkgrey;\n}\n\n.CodeMirror {\n    box-shadow: rgba(0, 0, 0, .5) 3px 3px 4px;\n    outline: 1px solid rgb(66%, 66%, 66%) !important;\n    background-color: white;\n}\n\n.CodeMirror-lines {\n    padding: 0;\n}\n\n.CodeMirror pre {\n    padding: 0;\n}\n\nbutton, input, select {\n  font-family: inherit;\n  font-size: inherit;\n}\n\n.editing {\n    -webkit-user-select: text;\n    box-shadow: rgba(0, 0, 0, .5) 3px 3px 4px;\n    outline: 1px solid rgb(66%, 66%, 66%) !important;\n    background-color: white;\n    -webkit-user-modify: read-write-plaintext-only;\n    text-overflow: clip !important;\n    padding-left: 2px;\n    margin-left: -2px;\n    padding-right: 2px;\n    margin-right: -2px;\n    margin-bottom: -1px;\n    padding-bottom: 1px;\n    opacity: 1.0 !important;\n}\n\n.editing,\n.editing * {\n    color: #222 !important;\n    text-decoration: none !important;\n}\n\n.editing br {\n    display: none;\n}\n\n.elements-gutter-decoration {\n    position: absolute;\n    left: 2px;\n    margin-top: 2px;\n    height: 9px;\n    width: 9px;\n    border-radius: 5px;\n    border: 1px solid orange;\n    background-color: orange;\n    cursor: pointer;\n}\n\n.elements-gutter-decoration.elements-has-decorated-children {\n    opacity: 0.5;\n}\n\n.add-attribute {\n    margin-left: 1px;\n    margin-right: 1px;\n    white-space: nowrap;\n}\n\n.webkit-html-attribute-value a {\n    cursor: default !important;\n}\n\n.elements-tree-nowrap, .elements-tree-nowrap .li {\n    white-space: pre !important;\n}\n\n.elements-disclosure .elements-tree-nowrap li {\n    word-wrap: normal;\n}\n\n/* DOM update highlight */\n@-webkit-keyframes dom-update-highlight-animation {\n    from {\n        background-color: rgb(158, 54, 153);\n        color: white;\n    }\n    80% {\n        background-color: rgb(245, 219, 244);\n        color: inherit;\n    }\n    to {\n        background-color: inherit;\n    }\n}\n\n@-webkit-keyframes dom-update-highlight-animation-dark {\n    from {\n        background-color: rgb(158, 54, 153);\n        color: white;\n    }\n    80% {\n        background-color: #333;\n        color: inherit;\n    }\n    to {\n        background-color: inherit;\n    }\n}\n\n.dom-update-highlight {\n    -webkit-animation: dom-update-highlight-animation 1.4s 1 cubic-bezier(0, 0, 0.2, 1);\n    border-radius: 2px;\n}\n\n:host-context(.-theme-with-dark-background) .dom-update-highlight {\n    -webkit-animation: dom-update-highlight-animation-dark 1.4s 1 cubic-bezier(0, 0, 0.2, 1);\n}\n\n.elements-disclosure.single-node li {\n    padding-left: 2px;\n}\n\n.elements-tree-shortcut-title {\n    color: rgb(87, 87, 87);\n}\n\nol:hover > li > .elements-tree-shortcut-link {\n    display: initial;\n}\n\n.elements-tree-shortcut-link {\n    color: rgb(87, 87, 87);\n    display: none;\n}\n\nol:focus li.selected .webkit-html-tag {\n    color: #a5a5a5;\n}\n\nol:focus li.selected .webkit-html-tag-name,\nol:focus li.selected .webkit-html-close-tag-name,\nol:focus li.selected .webkit-html-attribute-value,\nol:focus li.selected .webkit-html-external-link,\nol:focus li.selected .webkit-html-resource-link {\n    color: white;\n}\n\nol:focus li.selected .webkit-html-attribute-name {\n    color: #ccc;\n}\n\n.elements-disclosure .gutter-container {\n    position: absolute;\n    top: 0;\n}\n\n.elements-disclosure li.selected .gutter-container:not(.has-decorations) {\n    left: 0px;\n    width: 16.25px;\n    height: 18px;\n    transform: rotate(-90deg) translateX(-13px) scale(0.8);\n    transform-origin: 0% 0%;\n    -webkit-mask-image: url(Images/toolbarButtonGlyphs.png);\n    -webkit-mask-position: -201px -27px;\n    -webkit-mask-size: 352px 168px;\n    background-color: white;\n    cursor: pointer;\n}\n\n@media (-webkit-min-device-pixel-ratio: 1.5) {\n.elements-disclosure li.selected .gutter-container:not(.has-decorations) {\n    -webkit-mask-image: url(Images/toolbarButtonGlyphs_2x.png);\n}\n} /* media */\n\n/*# sourceURL=elements/elementsTreeOutline.css */";
Runtime.cachedResources["elements/spectrum.css"] = "/* https://github.com/bgrins/spectrum */\n:host {\n    width: 232px;\n    height: 240px;\n    -webkit-user-select: none;\n}\n\n:host(.palettes-enabled) {\n    height: 319px;\n}\n\n.spectrum-color {\n    position: relative;\n    width: 232px;\n    height: 124px;\n    border-radius: 2px 2px 0 0;\n    overflow: hidden;\n}\n\n.spectrum-display-value {\n    -webkit-user-select: text;\n    display: inline-block;\n    padding-left: 2px;\n}\n\n.spectrum-hue {\n    top: 140px;\n}\n\n.spectrum-alpha {\n    top: 159px;\n    background-image: url(Images/checker.png);\n    background-size: 12px 11px;\n}\n\n.spectrum-alpha-background {\n    height: 100%;\n    border-radius: 2px;\n}\n\n.spectrum-hue, .spectrum-alpha {\n    position: absolute;\n    right: 16px;\n    width: 130px;\n    height: 11px;\n    border-radius: 2px;\n}\n\n.spectrum-dragger,\n.spectrum-slider {\n    -webkit-user-select: none;\n}\n\n.spectrum-sat,\n.-theme-preserve {\n    background-image: linear-gradient(to right, white, rgba(204, 154, 129, 0));\n}\n\n.spectrum-val,\n.-theme-preserve {\n    background-image: linear-gradient(to top, black, rgba(204, 154, 129, 0));\n}\n\n.spectrum-hue {\n    background: linear-gradient(to left, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);\n}\n\n.spectrum-dragger {\n    border-radius: 12px;\n    height: 12px;\n    width: 12px;\n    border: 1px solid white;\n    cursor: pointer;\n    position: absolute;\n    top: 0;\n    left: 0;\n    background: black;\n    box-shadow: 0 0 2px 0px rgba(0, 0, 0, 0.24);\n}\n\n.spectrum-slider {\n    position: absolute;\n    top: -1px;\n    cursor: pointer;\n    width: 13px;\n    height: 13px;\n    border-radius: 13px;\n    background-color: rgb(248, 248, 248);\n    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.37);\n}\n\n.swatch {\n    width: 24px;\n    height: 24px;\n    margin: 0;\n    position: absolute;\n    top: 144px;\n    left: 47px;\n    background-image: url(Images/checker.png);\n    border-radius: 16px;\n}\n\n.swatch-inner {\n    width: 100%;\n    height: 100%;\n    display: inline-block;\n    border-radius: 16px;\n}\n\n.swatch-inner-white {\n    border: 1px solid #ddd;\n}\n\n.spectrum-text {\n    position: absolute;\n    top: 184px;\n    left: 16px;\n}\n\n.spectrum-text-value {\n    display: inline-block;\n    width: 40px;\n    overflow: hidden;\n    text-align: center;\n    border: 1px solid #dadada;\n    border-radius: 2px;\n    margin-right: 6px;\n    line-height: 20px;\n    font-size: 11px;\n    padding: 0;\n    color: #333;\n    white-space: nowrap;\n}\n\n.spectrum-text-label {\n    letter-spacing: 39.5px;\n    margin-top: 8px;\n    display: block;\n    color: #969696;\n    margin-left: 16px;\n    width: 174px;\n}\n\n.spectrum-text-hex > .spectrum-text-value {\n    width: 178px;\n}\n\n.spectrum-text-hex > .spectrum-text-label {\n    letter-spacing: normal;\n    margin-left: 0px;\n    text-align: center;\n}\n\n.spectrum-palette-value {\n    background-color: rgb(65, 75, 217);\n    border-radius: 2px;\n    margin-top: 12px;\n    margin-left: 12px;\n    width: 12px;\n    height: 12px;\n    display: inline-block;\n}\n\n.spectrum-switcher {\n    border-radius: 2px;\n    height: 20px;\n    width: 20px;\n    padding: 2px;\n}\n\n:host-context(.-theme-with-dark-background) .spectrum-switcher {\n    -webkit-filter: invert(60%);\n}\n\n.spectrum-display-switcher {\n    top: 196px;\n    position: absolute;\n    right: 10px;\n}\n\n.spectrum-switcher:hover {\n    background-color: #EEEEEE;\n}\n\n.spectrum-eye-dropper {\n    width: 32px;\n    height: 24px;\n    position: absolute;\n    left: 12px;\n    top: 144px;\n    cursor: pointer;\n}\n\n.spectrum-palette {\n    border-top: 1px solid #dadada;\n    position: absolute;\n    top: 235px;\n    width: 100%;\n    padding: 6px 24px 6px 6px;\n    display: flex;\n    flex-wrap: wrap;\n}\n\n.spectrum-palette-color {\n    width: 12px;\n    height: 12px;\n    flex: 0 0 12px;\n    border-radius: 2px;\n    margin: 6px;\n    cursor: pointer;\n    position: relative;\n    border: 1px solid rgba(0, 0, 0, 0.1);\n    background-position: -1px !important;\n}\n\n.spectrum-palette-color:hover:not(.spectrum-shades-shown) > .spectrum-palette-color-shadow {\n    opacity: 0.2;\n}\n\n.spectrum-palette-color:hover:not(.spectrum-shades-shown) > .spectrum-palette-color-shadow:first-child {\n    opacity: 0.6;\n    top: -3px;\n    left: 1px;\n}\n\n.spectrum-palette-color-shadow {\n    position: absolute;\n    opacity: 0;\n    margin: 0;\n    top: -5px;\n    left: 3px;\n}\n\n.palette-color-shades {\n    position: absolute;\n    background-color: white;\n    height: 228px;\n    width: 28px;\n    box-shadow: 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.4);\n    z-index: 14;\n    border-radius: 2px;\n    transform-origin: 0px 228px;\n    margin-top: -208px;\n    margin-left: -8px;\n}\n\n.spectrum-palette > .spectrum-palette-color.spectrum-shades-shown {\n    z-index: 15;\n}\n\n.palette-color-shades > .spectrum-palette-color {\n    margin: 8px 0 0 0;\n    margin-left: 8px;\n    width: 12px;\n}\n\n.spectrum-palette > .spectrum-palette-color {\n    transition: transform 100ms cubic-bezier(0, 0, 0.2, 1);\n    will-change: transform;\n    z-index: 13;\n}\n\n.spectrum-palette > .spectrum-palette-color.empty-color {\n    border-color: transparent;\n}\n\n.spectrum-palette > .spectrum-palette-color:not(.empty-color):not(.has-material-shades):hover,\n.palette-color-shades > .spectrum-palette-color:not(.empty-color):hover {\n    transform: scale(1.15);\n}\n\n.add-color-toolbar {\n    margin-left: -3px;\n    margin-top: -1px;\n}\n\n.spectrum-palette-switcher {\n    right: 10px;\n    top: 235px;\n    margin-top: 9px;\n    position: absolute;\n}\n\n.palette-panel {\n    width: 100%;\n    height: 100%;\n    position: absolute;\n    top: 100%;\n    display: flex;\n    flex-direction: column;\n    background-color: white;\n    z-index: 14;\n    transition: transform 200ms cubic-bezier(0, 0, 0.2, 1), visibility 0s 200ms;\n    border-top: 1px solid #dadada;\n    visibility: hidden;\n}\n\n.palette-panel-showing > .palette-panel {\n    transform: translateY(calc(-100% + 117px));\n    transition-delay: 0s;\n    visibility: visible;\n}\n\n.palette-panel > div.toolbar {\n    position: absolute;\n    right: 6px;\n    top: 6px;\n}\n\n.palette-panel > div:not(.toolbar) {\n    flex: 0 0 38px;\n    border-bottom: 1px solid #dadada;\n    padding: 12px;\n    line-height: 14px;\n    color: #333;\n}\n\n.palette-panel > div.palette-title {\n    font-size: 14px;\n    line-height: 16px;\n    color: #333;\n    flex-basis: 40px;\n}\n\ndiv.palette-preview {\n    display: flex;\n    cursor: pointer;\n}\n\n.palette-preview-title {\n    flex: 0 0 84px;\n}\n\n.palette-preview > .spectrum-palette-color {\n    margin-top: 1px;\n}\n\n.palette-preview:hover {\n    background-color: #eee;\n}\n\n.spectrum-overlay {\n    z-index: 13;\n    visibility: hidden;\n    background-color: hsla(0, 0%, 0%, 0.5);\n    opacity: 0;\n    transition: opacity 100ms cubic-bezier(0, 0, 0.2, 1), visibility 0s 100ms;\n}\n\n.palette-panel-showing > .spectrum-overlay {\n    transition-delay: 0s;\n    visibility: visible;\n    opacity: 1;\n}\n\n.spectrum-contrast-container {\n    width: 100%;\n    height: 100%;\n}\n\n.spectrum-contrast-line {\n    fill: none;\n    stroke: white;\n    opacity: 0.7;\n    stroke-width: 1.5px;\n}\n\n.delete-color-toolbar {\n    position: absolute;\n    right: 0;\n    top: 0;\n    background-color: #EFEFEF;\n    visibility: hidden;\n    z-index: 3;\n    width: 36px;\n    display: flex;\n    align-items: center;\n    padding-left: 4px;\n    bottom: 2px;\n    border-bottom-right-radius: 2px;\n}\n\n@keyframes showDeleteToolbar {\n    from {\n        opacity: 0;\n    }\n    to {\n        opacity: 1;\n    }\n}\n\n.delete-color-toolbar.dragging {\n    visibility: visible;\n    animation: showDeleteToolbar 100ms 150ms cubic-bezier(0, 0, 0.2, 1) backwards;\n}\n\n.delete-color-toolbar-active {\n    background-color: #ddd;\n    color: white;\n}\n\n/*# sourceURL=elements/spectrum.css */";
