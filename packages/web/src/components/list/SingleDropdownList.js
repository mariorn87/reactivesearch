import React, { Component } from "react";
import { connect } from "react-redux";

import {
	addComponent,
	removeComponent,
	watchComponent,
	updateQuery,
	setQueryOptions
} from "@appbaseio/reactivecore/lib/actions";
import {
	getQueryOptions,
	pushToAndClause,
	checkValueChange,
	getAggsOrder,
	checkPropChange,
	checkSomePropChange
} from "@appbaseio/reactivecore/lib/utils/helper";

import types from "@appbaseio/reactivecore/lib/utils/types";

import Title from "../../styles/Title";
import Dropdown from "../shared/Dropdown";

class SingleDropdownList extends Component {
	constructor(props) {
		super(props);

		this.state = {
			currentValue: "",
			options: []
		};
		this.type = "term";
		this.internalComponent = props.componentId + "__internal";
	}

	componentWillMount() {
		this.props.addComponent(this.internalComponent);
		this.props.addComponent(this.props.componentId);
		this.setReact(this.props);

		this.updateQueryOptions(this.props);

		if (this.props.defaultSelected) {
			this.setValue(this.props.defaultSelected);
		}
	}

	componentWillReceiveProps(nextProps) {
		checkPropChange(
			this.props.react,
			nextProps.react,
			() => this.setReact(nextProps)
		);
		checkPropChange(
			this.props.options,
			nextProps.options,
			() => {
				this.setState({
					options: nextProps.options[nextProps.dataField].buckets || []
				});
			}
		);
		checkSomePropChange(
			this.props,
			nextProps,
			["size", "sortBy"],
			() => this.updateQueryOptions(nextProps)
		);
		if (this.props.defaultSelected !== nextProps.defaultSelected) {
			this.setValue(nextProps.defaultSelected);
		} else if (this.state.currentValue !== nextProps.selectedValue) {
			this.setValue(nextProps.selectedValue || "");
		}
	}

	componentWillUnmount() {
		this.props.removeComponent(this.props.componentId);
		this.props.removeComponent(this.internalComponent);
	}

	setReact = (props) => {
		const { react } = props;
		if (react) {
			const newReact = pushToAndClause(react, this.internalComponent);
			props.watchComponent(props.componentId, newReact);
		} else {
			props.watchComponent(props.componentId, { and: this.internalComponent });
		}
	};

	defaultQuery = (value, props) => {
		if (this.selectAll) {
			return {
				exists: {
					field: [props.dataField]
				}
			};
		} else if (value) {
			return {
				[this.type]: {
					[props.dataField]: value
				}
			};
		}
		return null;
	}

	setValue = (value, props = this.props) => {
		const performUpdate = () => {
			this.setState({
				currentValue: value
			}, () => {
				const query = props.customQuery || this.defaultQuery;
				this.updateQuery(value, props);
			});
		}

		checkValueChange(
			props.componentId,
			value,
			props.beforeValueChange,
			props.onValueChange,
			performUpdate
		);
	};

	updateQuery = (value, props) => {
		const query = props.customQuery || this.defaultQuery;
		let onQueryChange = null;
		if (props.onQueryChange) {
			onQueryChange = props.onQueryChange;
		}
		props.updateQuery({
			componentId: props.componentId,
			query: query(value, props),
			value,
			label: props.filterLabel,
			showFilter: props.showFilter,
			onQueryChange,
			URLParams: props.URLParams
		});
	}

	updateQueryOptions = (props) => {
		const queryOptions = getQueryOptions(props);
		queryOptions.aggs = {
			[props.dataField]: {
				terms: {
					field: props.dataField,
					size: props.size,
					order: getAggsOrder(props.sortBy)
				}
			}
		}
		props.setQueryOptions(this.internalComponent, queryOptions);
		// Since the queryOptions are attached to the internal component,
		// we need to notify the subscriber (parent component)
		// that the query has changed because no new query will be
		// auto-generated for the internal component as its
		// dependency tree is empty
		props.updateQuery({
			componentId: this.internalComponent,
			query: null
		});
	}

	render() {
		return (
			<div>
				{this.props.title && <Title>{this.props.title}</Title>}
				<Dropdown
					items={this.state.options}
					onChange={this.setValue}
					selectedItem={this.state.currentValue}
					placeholder={this.props.placeholder}
					labelField="key"
				/>
			</div>
		);
	}
}

SingleDropdownList.propTypes = {
	componentId: types.componentId,
	addComponent: types.addComponent,
	dataField: types.dataField,
	sortBy: types.sortByWithCount,
	setQueryOptions: types.setQueryOptions,
	updateQuery: types.updateQuery,
	defaultSelected: types.string,
	react: types.react,
	options: types.options,
	removeComponent: types.removeComponent,
	beforeValueChange: types.beforeValueChange,
	onValueChange: types.onValueChange,
	customQuery: types.customQuery,
	onQueryChange: types.onQueryChange,
	placeholder: types.placeholder,
	title: types.title,
	filterLabel: types.string,
	selectedValue: types.selectedValue,
	URLParams: types.URLParams,
	showFilter: types.showFilter
}

SingleDropdownList.defaultProps = {
	size: 100,
	sortBy: "count",
	placeholder: "Select a value",
	URLParams: false,
	showFilter: true
}

const mapStateToProps = (state, props) => ({
	options: state.aggregations[props.componentId],
	selectedValue: state.selectedValues[props.componentId] && state.selectedValues[props.componentId].value || null
});

const mapDispatchtoProps = dispatch => ({
	addComponent: component => dispatch(addComponent(component)),
	removeComponent: component => dispatch(removeComponent(component)),
	watchComponent: (component, react) => dispatch(watchComponent(component, react)),
	updateQuery: (updateQueryObject) => dispatch(updateQuery(updateQueryObject)),
	setQueryOptions: (component, props) => dispatch(setQueryOptions(component, props))
});

export default connect(mapStateToProps, mapDispatchtoProps)(SingleDropdownList);