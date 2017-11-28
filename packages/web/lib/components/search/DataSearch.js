var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import React, { Component } from "react";
import { connect } from "react-redux";
import Downshift from "downshift";

import { addComponent as _addComponent, removeComponent as _removeComponent, watchComponent as _watchComponent, updateQuery as _updateQuery, setQueryOptions as _setQueryOptions } from "@appbaseio/reactivecore/lib/actions";
import { isEqual, debounce, pushToAndClause, checkValueChange, checkPropChange, checkSomePropChange } from "@appbaseio/reactivecore/lib/utils/helper";

import types from "@appbaseio/reactivecore/lib/utils/types";
import Title from "../../styles/Title";
import Input, { input, suggestions } from "../../styles/Input";

var DataSearch = function (_Component) {
	_inherits(DataSearch, _Component);

	function DataSearch(props) {
		_classCallCheck(this, DataSearch);

		var _this = _possibleConstructorReturn(this, _Component.call(this, props));

		_initialiseProps.call(_this);

		_this.state = {
			currentValue: "",
			suggestions: [],
			isOpen: false
		};
		_this.internalComponent = props.componentId + "__internal";
		return _this;
	}

	DataSearch.prototype.componentDidMount = function componentDidMount() {
		this.props.addComponent(this.props.componentId);
		this.props.addComponent(this.internalComponent);

		if (this.props.highlight) {
			var queryOptions = this.highlightQuery(this.props);
			this.props.setQueryOptions(this.props.componentId, queryOptions);
		}
		this.setReact(this.props);

		if (this.props.defaultSelected) {
			this.setValue(this.props.defaultSelected, true);
		}
	};

	DataSearch.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
		var _this2 = this;

		checkSomePropChange(this.props, nextProps, ["highlight", "dataField", "highlightField"], function () {
			var queryOptions = _this2.highlightQuery(nextProps);
			_this2.props.setQueryOptions(nextProps.componentId, queryOptions);
		});

		checkPropChange(this.props.react, nextProps.react, function () {
			return _this2.setReact(nextProps);
		});

		if (Array.isArray(nextProps.suggestions) && this.state.currentValue.trim().length) {
			checkPropChange(this.props.suggestions, nextProps.suggestions, function () {
				_this2.setState({
					suggestions: _this2.onSuggestions(nextProps.suggestions)
				});
			});
		}

		checkPropChange(this.props.defaultSelected, nextProps.defaultSelected, function () {
			return _this2.setValue(nextProps.defaultSelected, true, nextProps);
		});
	};

	DataSearch.prototype.componentWillUnmount = function componentWillUnmount() {
		this.props.removeComponent(this.props.componentId);
		this.props.removeComponent(this.internalComponent);
	};

	// only works if there's a change in downshift's value


	// delays the hiding of suggestions on click to allow suggestion selection


	DataSearch.prototype.render = function render() {
		var _this3 = this;

		var suggestionsList = this.state.currentValue === "" || this.state.currentValue === null ? this.props.defaultSuggestions && this.props.defaultSuggestions.length ? this.props.defaultSuggestions : [] : this.state.suggestions;

		return React.createElement(
			"div",
			null,
			this.props.title ? React.createElement(
				Title,
				null,
				this.props.title
			) : null,
			this.props.autoSuggest ? React.createElement(Downshift, {
				onChange: this.onSuggestionSelected,
				onOuterClick: this.handleOuterClick,
				render: function render(_ref) {
					var getInputProps = _ref.getInputProps,
					    getItemProps = _ref.getItemProps;
					return React.createElement(
						"div",
						null,
						React.createElement(Input, getInputProps({
							placeholder: _this3.props.placeholder,
							value: _this3.state.currentValue === null ? "" : _this3.state.currentValue,
							onChange: _this3.onInputChange,
							onBlur: _this3.handleBlur,
							onFocus: _this3.handleFocus,
							onKeyPress: _this3.props.onKeyPress,
							onKeyDown: _this3.handleKeyDown,
							onKeyUp: _this3.props.onKeyUp
						})),
						_this3.state.isOpen && suggestionsList.length ? React.createElement(
							"div",
							{ className: suggestions },
							React.createElement(
								"ul",
								null,
								suggestionsList.map(function (item, index) {
									return React.createElement(
										"li",
										_extends({}, getItemProps({ item: item }), {
											key: item.label
										}),
										item.label
									);
								})
							)
						) : null
					);
				}
			}) : React.createElement(Input, {
				placeholder: this.props.placeholder,
				value: this.state.currentValue ? this.state.currentValue : "",
				onChange: function onChange(e) {
					return _this3.setValue(e.target.value);
				},
				onBlur: this.props.onBlur,
				onFocus: this.props.onFocus,
				onKeyPress: this.props.onKeyPress,
				onKeyDown: this.props.onKeyDown,
				onKeyUp: this.props.onKeyUp,
				autoFocus: this.props.autoFocus
			})
		);
	};

	return DataSearch;
}(Component);

var _initialiseProps = function _initialiseProps() {
	var _this4 = this;

	this.setReact = function (props) {
		var react = props.react;

		if (react) {
			var newReact = pushToAndClause(react, _this4.internalComponent);
			props.watchComponent(props.componentId, newReact);
		} else {
			props.watchComponent(props.componentId, { and: _this4.internalComponent });
		}
	};

	this.highlightQuery = function (props) {
		if (!props.highlight) {
			return null;
		}
		var fields = {};
		var highlightField = props.highlightField ? props.highlightField : props.dataField;

		if (typeof highlightField === "string") {
			fields[highlightField] = {};
		} else if (Array.isArray(highlightField)) {
			highlightField.forEach(function (item) {
				fields[item] = {};
			});
		}

		return {
			highlight: {
				pre_tags: ["<mark>"],
				post_tags: ["</mark>"],
				fields: fields
			}
		};
	};

	this.defaultQuery = function (value, props) {
		var finalQuery = null,
		    fields = void 0;
		if (value) {
			if (Array.isArray(props.dataField)) {
				fields = props.dataField;
			} else {
				fields = [props.dataField];
			}
			finalQuery = {
				bool: {
					should: _this4.shouldQuery(value, fields, props),
					minimum_should_match: "1"
				}
			};
		}

		if (value === "") {
			finalQuery = {
				"match_all": {}
			};
		}

		return finalQuery;
	};

	this.shouldQuery = function (value, dataFields, props) {
		var fields = dataFields.map(function (field, index) {
			return "" + field + (Array.isArray(props.fieldWeights) && props.fieldWeights[index] ? "^" + props.fieldWeights[index] : "");
		});

		if (props.queryFormat === "and") {
			return [{
				multi_match: {
					query: value,
					fields: fields,
					type: "cross_fields",
					operator: "and",
					fuzziness: props.fuzziness ? props.fuzziness : 0
				}
			}, {
				multi_match: {
					query: value,
					fields: fields,
					type: "phrase_prefix",
					operator: "and"
				}
			}];
		}

		return [{
			multi_match: {
				query: value,
				fields: fields,
				type: "best_fields",
				operator: "or",
				fuzziness: props.fuzziness ? props.fuzziness : 0
			}
		}, {
			multi_match: {
				query: value,
				fields: fields,
				type: "phrase_prefix",
				operator: "or"
			}
		}];
	};

	this.onSuggestions = function (suggestions) {
		if (_this4.props.onSuggestions) {
			return _this4.props.onSuggestions(suggestions);
		}

		var fields = Array.isArray(_this4.props.dataField) ? _this4.props.dataField : [_this4.props.dataField];
		var suggestionsList = [];
		var labelsList = [];
		var currentValue = _this4.state.currentValue.toLowerCase();

		suggestions.forEach(function (item) {
			fields.forEach(function (field) {
				var label = item._source[field];
				var val = label.toLowerCase();

				if (val.includes(currentValue) && !labelsList.includes(val)) {
					var option = {
						label: label,
						value: label
					};
					labelsList = [].concat(labelsList, [val]);
					suggestionsList = [].concat(suggestionsList, [option]);
				}
			});
		});

		return suggestionsList;
	};

	this.setValue = function (value) {
		var isDefaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
		var props = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _this4.props;

		var performUpdate = function performUpdate() {
			_this4.setState({
				currentValue: value
			});
			if (isDefaultValue) {
				if (_this4.props.autoSuggest) {
					_this4.setState({
						isOpen: false
					});
					_this4.updateQuery(_this4.internalComponent, value, props);
				}
				_this4.updateQuery(props.componentId, value, props);
			} else {
				// debounce for handling text while typing
				_this4.handleTextChange(value);
			}
		};
		checkValueChange(props.componentId, value, props.beforeValueChange, props.onValueChange, performUpdate);
	};

	this.handleTextChange = debounce(function (value) {
		if (_this4.props.autoSuggest) {
			_this4.updateQuery(_this4.internalComponent, value, _this4.props);
		} else {
			_this4.updateQuery(_this4.props.componentId, value, _this4.props);
		}
	}, 300);

	this.updateQuery = function (component, value, props) {
		var query = props.customQuery || _this4.defaultQuery;
		var callback = null;
		if (component === props.componentId && props.onQueryChange) {
			callback = props.onQueryChange;
		}
		props.updateQuery(component, query(value, props), value, props.filterLabel, callback);
	};

	this.handleFocus = function (event) {
		_this4.setState({
			isOpen: true
		});
		if (_this4.props.onFocus) {
			_this4.props.onFocus(event);
		}
	};

	this.handleOuterClick = function () {
		_this4.setValue(_this4.state.currentValue, true);
	};

	this.handleBlur = function (event) {
		setTimeout(function () {
			_this4.setState({
				isOpen: false
			});
		}, 200);
		if (_this4.props.onBlur) {
			_this4.props.onBlur(event);
		}
	};

	this.handleKeyDown = function (event) {
		if (event.key === "Enter") {
			event.target.blur();
			_this4.handleBlur();
			_this4.setValue(event.target.value, true);
		}
		if (_this4.props.onKeyDown) {
			_this4.props.onKeyDown(event);
		}
	};

	this.onInputChange = function (e, v) {
		_this4.setValue(e.target.value);
	};

	this.onSuggestionSelected = function (suggestion, event) {
		_this4.setValue(suggestion.value, true);
		if (_this4.props.onBlur) {
			_this4.props.onBlur(event);
		}
	};
};

DataSearch.propTypes = {
	componentId: types.componentId,
	title: types.title,
	addComponent: types.addComponent,
	highlight: types.highlight,
	setQueryOptions: types.setQueryOptions,
	defaultSelected: types.string,
	dataField: types.dataFieldArray,
	highlightField: types.highlightField,
	react: types.react,
	suggestions: types.suggestions,
	defaultSuggestions: types.suggestions,
	removeComponent: types.removeComponent,
	fieldWeights: types.fieldWeights,
	queryFormat: types.queryFormatSearch,
	fuzziness: types.fuzziness,
	autoSuggest: types.autoSuggest,
	beforeValueChange: types.beforeValueChange,
	onValueChange: types.beforeValueChange,
	customQuery: types.customQuery,
	onQueryChange: types.onQueryChange,
	onSuggestions: types.onSuggestions,
	updateQuery: types.updateQuery,
	placeholder: types.placeholder,
	onBlur: types.onBlur,
	onFocus: types.onFocus,
	onKeyPress: types.onKeyPress,
	onKeyDown: types.onKeyDown,
	onKeyUp: types.onKeyUp,
	autoFocus: types.autoFocus
};

DataSearch.defaultProps = {
	placeholder: "Search",
	autoSuggest: true,
	queryFormat: "or"
};

var mapStateToProps = function mapStateToProps(state, props) {
	return {
		suggestions: state.hits[props.componentId] && state.hits[props.componentId].hits
	};
};

var mapDispatchtoProps = function mapDispatchtoProps(dispatch) {
	return {
		addComponent: function addComponent(component) {
			return dispatch(_addComponent(component));
		},
		removeComponent: function removeComponent(component) {
			return dispatch(_removeComponent(component));
		},
		watchComponent: function watchComponent(component, react) {
			return dispatch(_watchComponent(component, react));
		},
		updateQuery: function updateQuery(component, query, value, filterLabel, onQueryChange) {
			return dispatch(_updateQuery(component, query, value, filterLabel, onQueryChange));
		},
		setQueryOptions: function setQueryOptions(component, props) {
			return dispatch(_setQueryOptions(component, props));
		}
	};
};

export default connect(mapStateToProps, mapDispatchtoProps)(DataSearch);