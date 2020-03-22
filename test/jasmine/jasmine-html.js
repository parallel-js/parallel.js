jasmine.HtmlReporterHelpers = {};

jasmine.HtmlReporterHelpers.createDom = function(type, attrs, childrenVarArgs) {
  const el = document.createElement(type);

  for (let i = 2; i < arguments.length; i++) {
    const child = arguments[i];

    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child) {
      el.appendChild(child);
    }
  }

  for (const attr in attrs) {
    if (attr == 'className') {
      el[attr] = attrs[attr];
    } else {
      el.setAttribute(attr, attrs[attr]);
    }
  }

  return el;
};

jasmine.HtmlReporterHelpers.getSpecStatus = function(child) {
  const results = child.results();
  let status = results.passed() ? 'passed' : 'failed';
  if (results.skipped) {
    status = 'skipped';
  }

  return status;
};

jasmine.HtmlReporterHelpers.appendToSummary = function(child, childElement) {
  let parentDiv = this.dom.summary;
  const parentSuite =
    typeof child.parentSuite === 'undefined' ? 'suite' : 'parentSuite';
  const parent = child[parentSuite];

  if (parent) {
    if (typeof this.views.suites[parent.id] === 'undefined') {
      this.views.suites[parent.id] = new jasmine.HtmlReporter.SuiteView(
        parent,
        this.dom,
        this.views
      );
    }
    parentDiv = this.views.suites[parent.id].element;
  }

  parentDiv.appendChild(childElement);
};

jasmine.HtmlReporterHelpers.addHelpers = function(ctor) {
  for (const fn in jasmine.HtmlReporterHelpers) {
    ctor.prototype[fn] = jasmine.HtmlReporterHelpers[fn];
  }
};

jasmine.HtmlReporter = function(_doc) {
  const self = this;
  const doc = _doc || window.document;

  let reporterView;

  const dom = {};

  // Jasmine Reporter Public Interface
  self.logRunningSpecs = false;

  self.reportRunnerStarting = function(runner) {
    const specs = runner.specs() || [];

    if (specs.length == 0) {
      return;
    }

    createReporterDom(runner.env.versionString());
    doc.body.appendChild(dom.reporter);
    setExceptionHandling();

    reporterView = new jasmine.HtmlReporter.ReporterView(dom);
    reporterView.addSpecs(specs, self.specFilter);
  };

  self.reportRunnerResults = function(runner) {
    reporterView && reporterView.complete();
  };

  self.reportSuiteResults = function(suite) {
    reporterView.suiteComplete(suite);
  };

  self.reportSpecStarting = function(spec) {
    if (self.logRunningSpecs) {
      self.log(
        `>> Jasmine Running ${spec.suite.description} ${spec.description}...`
      );
    }
  };

  self.reportSpecResults = function(spec) {
    reporterView.specComplete(spec);
  };

  self.log = function() {
    const { console } = jasmine.getGlobal();
    if (console && console.log) {
      if (console.log.apply) {
        console.log(...arguments);
      } else {
        console.log(arguments); // ie fix: console.log.apply doesn't exist on ie
      }
    }
  };

  self.specFilter = function(spec) {
    if (!focusedSpecName()) {
      return true;
    }

    return spec.getFullName().indexOf(focusedSpecName()) === 0;
  };

  return self;

  function focusedSpecName() {
    let specName;

    (function memoizeFocusedSpec() {
      if (specName) {
        return;
      }

      const paramMap = [];
      const params = jasmine.HtmlReporter.parameters(doc);

      for (let i = 0; i < params.length; i++) {
        const p = params[i].split('=');
        paramMap[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
      }

      specName = paramMap.spec;
    })();

    return specName;
  }

  function createReporterDom(version) {
    dom.reporter = self.createDom(
      'div',
      { id: 'HTMLReporter', className: 'jasmine_reporter' },
      (dom.banner = self.createDom(
        'div',
        { className: 'banner' },
        self.createDom('span', { className: 'title' }, 'Jasmine '),
        self.createDom('span', { className: 'version' }, version)
      )),
      (dom.symbolSummary = self.createDom('ul', {
        className: 'symbolSummary'
      })),
      (dom.alert = self.createDom(
        'div',
        { className: 'alert' },
        self.createDom(
          'span',
          { className: 'exceptions' },
          self.createDom(
            'label',
            { className: 'label', for: 'no_try_catch' },
            'No try/catch'
          ),
          self.createDom('input', { id: 'no_try_catch', type: 'checkbox' })
        )
      )),
      (dom.results = self.createDom(
        'div',
        { className: 'results' },
        (dom.summary = self.createDom('div', { className: 'summary' })),
        (dom.details = self.createDom('div', { id: 'details' }))
      ))
    );
  }

  function noTryCatch() {
    return window.location.search.match(/catch=false/);
  }

  function searchWithCatch() {
    const params = jasmine.HtmlReporter.parameters(window.document);
    let removed = false;
    let i = 0;

    while (!removed && i < params.length) {
      if (params[i].match(/catch=/)) {
        params.splice(i, 1);
        removed = true;
      }
      i++;
    }
    if (jasmine.CATCH_EXCEPTIONS) {
      params.push('catch=false');
    }

    return params.join('&');
  }

  function setExceptionHandling() {
    const chxCatch = document.getElementById('no_try_catch');

    if (noTryCatch()) {
      chxCatch.setAttribute('checked', true);
      jasmine.CATCH_EXCEPTIONS = false;
    }
    chxCatch.onclick = function() {
      window.location.search = searchWithCatch();
    };
  }
};
jasmine.HtmlReporter.parameters = function(doc) {
  const paramStr = doc.location.search.substring(1);
  let params = [];

  if (paramStr.length > 0) {
    params = paramStr.split('&');
  }
  return params;
};
jasmine.HtmlReporter.sectionLink = function(sectionName) {
  let link = '?';
  const params = [];

  if (sectionName) {
    params.push(`spec=${encodeURIComponent(sectionName)}`);
  }
  if (!jasmine.CATCH_EXCEPTIONS) {
    params.push('catch=false');
  }
  if (params.length > 0) {
    link += params.join('&');
  }

  return link;
};
jasmine.HtmlReporterHelpers.addHelpers(jasmine.HtmlReporter);
jasmine.HtmlReporter.ReporterView = function(dom) {
  this.startedAt = new Date();
  this.runningSpecCount = 0;
  this.completeSpecCount = 0;
  this.passedCount = 0;
  this.failedCount = 0;
  this.skippedCount = 0;

  this.createResultsMenu = function() {
    this.resultsMenu = this.createDom(
      'span',
      { className: 'resultsMenu bar' },
      (this.summaryMenuItem = this.createDom(
        'a',
        { className: 'summaryMenuItem', href: '#' },
        '0 specs'
      )),
      ' | ',
      (this.detailsMenuItem = this.createDom(
        'a',
        { className: 'detailsMenuItem', href: '#' },
        '0 failing'
      ))
    );

    this.summaryMenuItem.onclick = function() {
      dom.reporter.className = dom.reporter.className.replace(
        / showDetails/g,
        ''
      );
    };

    this.detailsMenuItem.onclick = function() {
      showDetails();
    };
  };

  this.addSpecs = function(specs, specFilter) {
    this.totalSpecCount = specs.length;

    this.views = {
      specs: {},
      suites: {}
    };

    for (let i = 0; i < specs.length; i++) {
      const spec = specs[i];
      this.views.specs[spec.id] = new jasmine.HtmlReporter.SpecView(
        spec,
        dom,
        this.views
      );
      if (specFilter(spec)) {
        this.runningSpecCount++;
      }
    }
  };

  this.specComplete = function(spec) {
    this.completeSpecCount++;

    if (isUndefined(this.views.specs[spec.id])) {
      this.views.specs[spec.id] = new jasmine.HtmlReporter.SpecView(spec, dom);
    }

    const specView = this.views.specs[spec.id];

    switch (specView.status()) {
      case 'passed':
        this.passedCount++;
        break;

      case 'failed':
        this.failedCount++;
        break;

      case 'skipped':
        this.skippedCount++;
        break;
    }

    specView.refresh();
    this.refresh();
  };

  this.suiteComplete = function(suite) {
    const suiteView = this.views.suites[suite.id];
    if (isUndefined(suiteView)) {
      return;
    }
    suiteView.refresh();
  };

  this.refresh = function() {
    if (isUndefined(this.resultsMenu)) {
      this.createResultsMenu();
    }

    // currently running UI
    if (isUndefined(this.runningAlert)) {
      this.runningAlert = this.createDom('a', {
        href: jasmine.HtmlReporter.sectionLink(),
        className: 'runningAlert bar'
      });
      dom.alert.appendChild(this.runningAlert);
    }
    this.runningAlert.innerHTML = `Running ${
      this.completeSpecCount
    } of ${specPluralizedFor(this.totalSpecCount)}`;

    // skipped specs UI
    if (isUndefined(this.skippedAlert)) {
      this.skippedAlert = this.createDom('a', {
        href: jasmine.HtmlReporter.sectionLink(),
        className: 'skippedAlert bar'
      });
    }

    this.skippedAlert.innerHTML = `Skipping ${
      this.skippedCount
    } of ${specPluralizedFor(this.totalSpecCount)} - run all`;

    if (this.skippedCount === 1 && isDefined(dom.alert)) {
      dom.alert.appendChild(this.skippedAlert);
    }

    // passing specs UI
    if (isUndefined(this.passedAlert)) {
      this.passedAlert = this.createDom('span', {
        href: jasmine.HtmlReporter.sectionLink(),
        className: 'passingAlert bar'
      });
    }
    this.passedAlert.innerHTML = `Passing ${specPluralizedFor(
      this.passedCount
    )}`;

    // failing specs UI
    if (isUndefined(this.failedAlert)) {
      this.failedAlert = this.createDom('span', {
        href: '?',
        className: 'failingAlert bar'
      });
    }
    this.failedAlert.innerHTML = `Failing ${specPluralizedFor(
      this.failedCount
    )}`;

    if (this.failedCount === 1 && isDefined(dom.alert)) {
      dom.alert.appendChild(this.failedAlert);
      dom.alert.appendChild(this.resultsMenu);
    }

    // summary info
    this.summaryMenuItem.innerHTML = `${specPluralizedFor(
      this.runningSpecCount
    )}`;
    this.detailsMenuItem.innerHTML = `${String(this.failedCount)} failing`;
  };

  this.complete = function() {
    dom.alert.removeChild(this.runningAlert);

    this.skippedAlert.innerHTML = `Ran ${
      this.runningSpecCount
    } of ${specPluralizedFor(this.totalSpecCount)} - run all`;

    if (this.failedCount === 0) {
      dom.alert.appendChild(
        this.createDom(
          'span',
          { className: 'passingAlert bar' },
          `Passing ${specPluralizedFor(this.passedCount)}`
        )
      );
    } else {
      showDetails();
    }

    dom.banner.appendChild(
      this.createDom(
        'span',
        { className: 'duration' },
        `finished in ${(new Date().getTime() - this.startedAt.getTime()) /
          1000}s`
      )
    );
  };

  return this;

  function showDetails() {
    if (dom.reporter.className.search(/showDetails/) === -1) {
      dom.reporter.className += ' showDetails';
    }
  }

  function isUndefined(obj) {
    return typeof obj === 'undefined';
  }

  function isDefined(obj) {
    return !isUndefined(obj);
  }

  function specPluralizedFor(count) {
    let str = `${count} spec`;
    if (count > 1) {
      str += 's';
    }
    return str;
  }
};

jasmine.HtmlReporterHelpers.addHelpers(jasmine.HtmlReporter.ReporterView);

jasmine.HtmlReporter.SpecView = function(spec, dom, views) {
  this.spec = spec;
  this.dom = dom;
  this.views = views;

  this.symbol = this.createDom('li', { className: 'pending' });
  this.dom.symbolSummary.appendChild(this.symbol);

  this.summary = this.createDom(
    'div',
    { className: 'specSummary' },
    this.createDom(
      'a',
      {
        className: 'description',
        href: jasmine.HtmlReporter.sectionLink(this.spec.getFullName()),
        title: this.spec.getFullName()
      },
      this.spec.description
    )
  );

  this.detail = this.createDom(
    'div',
    { className: 'specDetail' },
    this.createDom(
      'a',
      {
        className: 'description',
        href: `?spec=${encodeURIComponent(this.spec.getFullName())}`,
        title: this.spec.getFullName()
      },
      this.spec.getFullName()
    )
  );
};

jasmine.HtmlReporter.SpecView.prototype.status = function() {
  return this.getSpecStatus(this.spec);
};

jasmine.HtmlReporter.SpecView.prototype.refresh = function() {
  this.symbol.className = this.status();

  switch (this.status()) {
    case 'skipped':
      break;

    case 'passed':
      this.appendSummaryToSuiteDiv();
      break;

    case 'failed':
      this.appendSummaryToSuiteDiv();
      this.appendFailureDetail();
      break;
  }
};

jasmine.HtmlReporter.SpecView.prototype.appendSummaryToSuiteDiv = function() {
  this.summary.className += ` ${this.status()}`;
  this.appendToSummary(this.spec, this.summary);
};

jasmine.HtmlReporter.SpecView.prototype.appendFailureDetail = function() {
  this.detail.className += ` ${this.status()}`;

  const resultItems = this.spec.results().getItems();
  const messagesDiv = this.createDom('div', { className: 'messages' });

  for (let i = 0; i < resultItems.length; i++) {
    const result = resultItems[i];

    if (result.type == 'log') {
      messagesDiv.appendChild(
        this.createDom(
          'div',
          { className: 'resultMessage log' },
          result.toString()
        )
      );
    } else if (result.type == 'expect' && result.passed && !result.passed()) {
      messagesDiv.appendChild(
        this.createDom(
          'div',
          { className: 'resultMessage fail' },
          result.message
        )
      );

      if (result.trace.stack) {
        messagesDiv.appendChild(
          this.createDom('div', { className: 'stackTrace' }, result.trace.stack)
        );
      }
    }
  }

  if (messagesDiv.childNodes.length > 0) {
    this.detail.appendChild(messagesDiv);
    this.dom.details.appendChild(this.detail);
  }
};

jasmine.HtmlReporterHelpers.addHelpers(jasmine.HtmlReporter.SpecView);
jasmine.HtmlReporter.SuiteView = function(suite, dom, views) {
  this.suite = suite;
  this.dom = dom;
  this.views = views;

  this.element = this.createDom(
    'div',
    { className: 'suite' },
    this.createDom(
      'a',
      {
        className: 'description',
        href: jasmine.HtmlReporter.sectionLink(this.suite.getFullName())
      },
      this.suite.description
    )
  );

  this.appendToSummary(this.suite, this.element);
};

jasmine.HtmlReporter.SuiteView.prototype.status = function() {
  return this.getSpecStatus(this.suite);
};

jasmine.HtmlReporter.SuiteView.prototype.refresh = function() {
  this.element.className += ` ${this.status()}`;
};

jasmine.HtmlReporterHelpers.addHelpers(jasmine.HtmlReporter.SuiteView);

/* @deprecated Use jasmine.HtmlReporter instead
 */
jasmine.TrivialReporter = function(doc) {
  this.document = doc || document;
  this.suiteDivs = {};
  this.logRunningSpecs = false;
};

jasmine.TrivialReporter.prototype.createDom = function(
  type,
  attrs,
  childrenVarArgs
) {
  const el = document.createElement(type);

  for (let i = 2; i < arguments.length; i++) {
    const child = arguments[i];

    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child) {
      el.appendChild(child);
    }
  }

  for (const attr in attrs) {
    if (attr == 'className') {
      el[attr] = attrs[attr];
    } else {
      el.setAttribute(attr, attrs[attr]);
    }
  }

  return el;
};

jasmine.TrivialReporter.prototype.reportRunnerStarting = function(runner) {
  let showPassed;
  let showSkipped;

  this.outerDiv = this.createDom(
    'div',
    { id: 'TrivialReporter', className: 'jasmine_reporter' },
    this.createDom(
      'div',
      { className: 'banner' },
      this.createDom(
        'div',
        { className: 'logo' },
        this.createDom('span', { className: 'title' }, 'Jasmine'),
        this.createDom(
          'span',
          { className: 'version' },
          runner.env.versionString()
        )
      ),
      this.createDom(
        'div',
        { className: 'options' },
        'Show ',
        (showPassed = this.createDom('input', {
          id: '__jasmine_TrivialReporter_showPassed__',
          type: 'checkbox'
        })),
        this.createDom(
          'label',
          { for: '__jasmine_TrivialReporter_showPassed__' },
          ' passed '
        ),
        (showSkipped = this.createDom('input', {
          id: '__jasmine_TrivialReporter_showSkipped__',
          type: 'checkbox'
        })),
        this.createDom(
          'label',
          { for: '__jasmine_TrivialReporter_showSkipped__' },
          ' skipped'
        )
      )
    ),

    (this.runnerDiv = this.createDom(
      'div',
      { className: 'runner running' },
      this.createDom('a', { className: 'run_spec', href: '?' }, 'run all'),
      (this.runnerMessageSpan = this.createDom('span', {}, 'Running...')),
      (this.finishedAtSpan = this.createDom(
        'span',
        { className: 'finished-at' },
        ''
      ))
    ))
  );

  this.document.body.appendChild(this.outerDiv);

  const suites = runner.suites();
  for (let i = 0; i < suites.length; i++) {
    const suite = suites[i];
    const suiteDiv = this.createDom(
      'div',
      { className: 'suite' },
      this.createDom(
        'a',
        {
          className: 'run_spec',
          href: `?spec=${encodeURIComponent(suite.getFullName())}`
        },
        'run'
      ),
      this.createDom(
        'a',
        {
          className: 'description',
          href: `?spec=${encodeURIComponent(suite.getFullName())}`
        },
        suite.description
      )
    );
    this.suiteDivs[suite.id] = suiteDiv;
    let parentDiv = this.outerDiv;
    if (suite.parentSuite) {
      parentDiv = this.suiteDivs[suite.parentSuite.id];
    }
    parentDiv.appendChild(suiteDiv);
  }

  this.startedAt = new Date();

  const self = this;
  showPassed.onclick = function(evt) {
    if (showPassed.checked) {
      self.outerDiv.className += ' show-passed';
    } else {
      self.outerDiv.className = self.outerDiv.className.replace(
        / show-passed/,
        ''
      );
    }
  };

  showSkipped.onclick = function(evt) {
    if (showSkipped.checked) {
      self.outerDiv.className += ' show-skipped';
    } else {
      self.outerDiv.className = self.outerDiv.className.replace(
        / show-skipped/,
        ''
      );
    }
  };
};

jasmine.TrivialReporter.prototype.reportRunnerResults = function(runner) {
  const results = runner.results();
  const className = results.failedCount > 0 ? 'runner failed' : 'runner passed';
  this.runnerDiv.setAttribute('class', className);
  // do it twice for IE
  this.runnerDiv.setAttribute('className', className);
  const specs = runner.specs();
  let specCount = 0;
  for (let i = 0; i < specs.length; i++) {
    if (this.specFilter(specs[i])) {
      specCount++;
    }
  }
  let message = `${String(specCount)} spec${specCount == 1 ? '' : 's'}, ${
    results.failedCount
  } failure${results.failedCount == 1 ? '' : 's'}`;
  message += ` in ${(new Date().getTime() - this.startedAt.getTime()) / 1000}s`;
  this.runnerMessageSpan.replaceChild(
    this.createDom('a', { className: 'description', href: '?' }, message),
    this.runnerMessageSpan.firstChild
  );

  this.finishedAtSpan.appendChild(
    document.createTextNode(`Finished at ${new Date().toString()}`)
  );
};

jasmine.TrivialReporter.prototype.reportSuiteResults = function(suite) {
  const results = suite.results();
  let status = results.passed() ? 'passed' : 'failed';
  if (results.totalCount === 0) {
    // todo: change this to check results.skipped
    status = 'skipped';
  }
  this.suiteDivs[suite.id].className += ` ${status}`;
};

jasmine.TrivialReporter.prototype.reportSpecStarting = function(spec) {
  if (this.logRunningSpecs) {
    this.log(
      `>> Jasmine Running ${spec.suite.description} ${spec.description}...`
    );
  }
};

jasmine.TrivialReporter.prototype.reportSpecResults = function(spec) {
  const results = spec.results();
  let status = results.passed() ? 'passed' : 'failed';
  if (results.skipped) {
    status = 'skipped';
  }
  const specDiv = this.createDom(
    'div',
    { className: `spec ${status}` },
    this.createDom(
      'a',
      {
        className: 'run_spec',
        href: `?spec=${encodeURIComponent(spec.getFullName())}`
      },
      'run'
    ),
    this.createDom(
      'a',
      {
        className: 'description',
        href: `?spec=${encodeURIComponent(spec.getFullName())}`,
        title: spec.getFullName()
      },
      spec.description
    )
  );

  const resultItems = results.getItems();
  const messagesDiv = this.createDom('div', { className: 'messages' });
  for (let i = 0; i < resultItems.length; i++) {
    const result = resultItems[i];

    if (result.type == 'log') {
      messagesDiv.appendChild(
        this.createDom(
          'div',
          { className: 'resultMessage log' },
          result.toString()
        )
      );
    } else if (result.type == 'expect' && result.passed && !result.passed()) {
      messagesDiv.appendChild(
        this.createDom(
          'div',
          { className: 'resultMessage fail' },
          result.message
        )
      );

      if (result.trace.stack) {
        messagesDiv.appendChild(
          this.createDom('div', { className: 'stackTrace' }, result.trace.stack)
        );
      }
    }
  }

  if (messagesDiv.childNodes.length > 0) {
    specDiv.appendChild(messagesDiv);
  }

  this.suiteDivs[spec.suite.id].appendChild(specDiv);
};

jasmine.TrivialReporter.prototype.log = function() {
  const { console } = jasmine.getGlobal();
  if (console && console.log) {
    if (console.log.apply) {
      console.log(...arguments);
    } else {
      console.log(arguments); // ie fix: console.log.apply doesn't exist on ie
    }
  }
};

jasmine.TrivialReporter.prototype.getLocation = function() {
  return this.document.location;
};

jasmine.TrivialReporter.prototype.specFilter = function(spec) {
  const paramMap = {};
  const params = this.getLocation()
    .search.substring(1)
    .split('&');
  for (let i = 0; i < params.length; i++) {
    const p = params[i].split('=');
    paramMap[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
  }

  if (!paramMap.spec) {
    return true;
  }
  return spec.getFullName().indexOf(paramMap.spec) === 0;
};
