import React, { useState, useEffect, Fragment } from "react";
import Autosuggest from "react-autosuggest";
import { useSharedContext } from "../SharedContextProvider";
import { msearch } from "../utils";

export default function Rule({ fields, operators, combinators, ...props }) {
  const [{ url, headers }] = useSharedContext();
  const [combinator, setCombinator] = useState(props.combinator);
  const [field, setField] = useState(props.field);
  const [operator, setOperator] = useState(props.operator);
  const [value, setValue] = useState(props.value);
  const [suggestions, setSuggestions] = useState([]);
  const [seeMore, setSeeMore] = useState(false);

  useEffect(() => {
    props.onChange({ field, operator, value, combinator, index: props.index });
  }, [field, operator, value, combinator]);

  const combinatorElement = props.index ? (
    <select
      className="react-es-rule-combinator"
      value={combinator}
      onChange={e => setCombinator(e.target.value)}
    >
      {combinators.map(c => (
        <option key={c.value} value={c.value}>
          {c.text}
        </option>
      ))}
    </select>
  ) : null;

  const deleteButton = props.index ? (
    <button className="react-es-rule-delete" onClick={() => props.onDelete(props.index)}>
      x
    </button>
  ) : null;

  let input = null;
  if (operators.find(o => o.value === operator && o.useInput)) {
    // Autocomplete zone.
    if (props.autoComplete && !Array.isArray(field)) {
      input = (
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={async ({ value }) => {
            let query;
            const suggestionQuery = operators.find(o => o.value === operator).suggestionQuery;
            if (suggestionQuery) {
              query = suggestionQuery(field, value);
            } else {
              const terms = { field, include: `.*${value}.*`, order: { _count: "desc" }, size: 10 };
              query = { query: { match_all: {} }, aggs: { [field]: { terms } }, size: 0 };
            }
            const suggestions = await msearch(url, [{ query, id: "queryBuilder" }], headers);
            setSuggestions(suggestions.responses[0].aggregations[field].buckets.map(e => e.key));
          }}
          onSuggestionsClearRequested={() => setSuggestions([])}
          getSuggestionValue={suggestion => suggestion}
          renderSuggestion={suggestion => <div>{suggestion}</div>}
          inputProps={{
            value,
            onChange: (event, { newValue }) => setValue(newValue),
            className: "react-es-rule-value",
            autoComplete: "new-password"
          }}
        />
      );
    } else {
      input = (
        <input
          className="react-es-rule-value"
          value={value}
          autoComplete="new-password"
          onChange={e => setValue(e.target.value)}
        />
      );
    }
  }

  //Test si la liste déroulante doit être complète ou non
  if(!seeMore){
    const indexGroup = fields.findIndex(e => e.group == true)
    fields.map( (item, index) => {
      if(item.value && item.value.length && item.value.length < 2){
        if(item.value[0] == field && index > indexGroup){
          setSeeMore(true);
        }
      }
    })
  }

  //MainOptions = true pour les premiers options du select
  let mainOptions = true;
  let hasGroup = false;
  return (
    <div className="react-es-rule">
      {combinatorElement}
      <select
        className="react-es-rule-field"
        value={fields.findIndex(e => String(e.value) === String(field))}
        onChange={e => {
          e.target.value == "seeMore" ? 
          setSeeMore(true) : 
          setField(fields[e.target.value].value)
        }}
      >
        {fields.map((field, index) => {
          //Si le field est un titre de group, mainOptions = false et ajout du groupe si
          if(field.group){
            hasGroup = true;
            if(mainOptions){
              mainOptions = false;
              return (
                seeMore && <option className="groupTitle" disabled>
                  {"- " + field.text}
                </option>
              );
            }
          }
          //Si field normal, affiché si mainOptions ou si on a cliqué sur voir plus
          else if(!field.group && (mainOptions || seeMore)){
            return (
              <Fragment>
                <option className="option_enabled" key={index} value={index}>
                  {field.text}
                </option>
                <option className="option_disabled" disabled>
                  {field.fields}
                </option>
              </Fragment>
            );
          }
        })}
        
        {(!seeMore && hasGroup) &&
        <option className="seeMoreOption" key="seeMore" value="seeMore" disabled={false}>
          { "+ Voir plus"}
        </option>}
      </select>
      <select
        className="react-es-rule-operator"
        value={operator}
        onChange={e => setOperator(e.target.value)}
      >
        {operators.map(o => {
          return (
            <option key={o.value} value={o.value}>
              {o.text}
            </option>
          );
        })}
      </select>
      {input}
      <button className="react-es-rule-add" onClick={props.onAdd}>
        +
      </button>
      {deleteButton}
    </div>
  );
}
