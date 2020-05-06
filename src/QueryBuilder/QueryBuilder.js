import React, { useState, useEffect } from "react";
import { useSharedContext } from "../SharedContextProvider";
import {
  defaultOperators,
  defaultCombinators,
  mergedQueries,
  uuidv4,
  withUniqueKey
} from "./utils";
import Rule from "./Rule";

export default function QueryBuilder({
  fields,
  operators,
  combinators,
  templateRule,
  initialValue,
  id,
  autoComplete
}) {
  const [, dispatch] = useSharedContext();
  operators = operators || defaultOperators;
  combinators = combinators || defaultCombinators;
  templateRule = templateRule || {
    field: fields[0].value,
    operator: operators[0].value,
    value: "",
    combinator: "AND",
    index: 0
  };
  const [rules, setRules] = useState(withUniqueKey(initialValue || [templateRule]));

  function rulesToStructuredObject(rules){
    let groupedByFieldRules = groupByField(rules);
    return groupedByFieldRulesToObject(groupedByFieldRules);
  }

  // groupé par field
  function groupedByFieldRulesToObject(rules){
    let returnedObject = {};

    if(rules.length === 1){  
      returnedObject = groupedByCombinatorRulesToObject(groupByCombitanor(rules[0]))
    }
    else{
      let lastOperation = rules.splice(rules.length - 1, 1)[0];
      let mainCombinator = lastOperation[0].combinator;
      let resultObject = [];

      resultObject.push(groupedByFieldRulesToObject(rules));
      resultObject.push(groupedByCombinatorRulesToObject(groupByCombitanor(lastOperation)));

      if(mainCombinator == "AND"){
        returnedObject.AND = resultObject;
      }
      else{
        returnedObject.OR = resultObject;
      }
    }
    return returnedObject;
  }

  function groupedByCombinatorRulesToObject(rules){
    let returnedObject = {};
    if(rules.length == 1){
      if(rules[0].length == 1){
        returnedObject = rules[0][0];
      }
      else{
        let combinator = rules[0][1].combinator;

        if(combinator === "AND"){
          returnedObject.AND = [];
          rules[0].forEach(rule => {
            returnedObject.AND.push(rule);
          })
        }
        else{
          returnedObject.OR = [];
          rules[0].forEach(rule => {
            returnedObject.OR.push(rule);
          })
        }
      }
      
    }
    else{
      let lastOperation = rules.splice(rules.length - 1, 1);
      let mainCombinator = lastOperation[0][0].combinator;
      let resultObject = [];

      resultObject.push(groupedByCombinatorRulesToObject(rules));
      resultObject.push(groupedByCombinatorRulesToObject(lastOperation));

      if(mainCombinator == "AND"){
        returnedObject.AND = resultObject;
      }
      else{
        returnedObject.OR = resultObject;
      }
    }

    return returnedObject;
  }

  function groupByCombitanor(rules){
    let prevCombinator = "";
    let groupedByCombinatorRules = [];
    let indexGroupedRules = 0;

    // Regroupement des opérations par field (pour le plaçage des parentèses logiques)
    rules.forEach((rule, index) => {
      // Le combinator du premier élément n'entre pas en compte
      if(index == 0){
        groupedByCombinatorRules[indexGroupedRules] = [];
        groupedByCombinatorRules[indexGroupedRules].push(rule);
      } // Le deuxième élément est forcément groupé avec le premier
      else if(index == 1){
        prevCombinator = rule.combinator;
        groupedByCombinatorRules[indexGroupedRules].push(rule);
      }
      else if(rule.combinator !== prevCombinator){
        prevCombinator = rule.combinator;
        indexGroupedRules++;
        groupedByCombinatorRules[indexGroupedRules] = [];
        groupedByCombinatorRules[indexGroupedRules].push(rule);
      }
      else{
        groupedByCombinatorRules[indexGroupedRules].push(rule);
      }
    })

    return groupedByCombinatorRules
  }

  function groupByField(rules){
    let prevField = "";
    let groupedByFieldRules = [];
    let indexGroupedRules = -1;
    // Regroupement des opérations par field (pour le plaçage des parentèses logiques)
    rules.forEach(rule => {
      if(rule.field !== prevField){
        prevField = rule.field;
        indexGroupedRules++;
        groupedByFieldRules[indexGroupedRules] = [];
        groupedByFieldRules[indexGroupedRules].push(rule);
      }
      else{
        groupedByFieldRules[indexGroupedRules].push(rule);
      }
    })

    return groupedByFieldRules
  }

  useEffect(() => {
    const structuredRules = rulesToStructuredObject(rules);
    const queries = buildMainQuery([structuredRules]);
    dispatch({
      type: "setWidget",
      key: id,
      needsQuery: true,
      needsConfiguration: false,
      isFacet: false,
      wantResults: false,
      query: queries,
      value: rules.map(r => ({
        field: r.field,
        operator: r.operator,
        value: r.value,
        combinator: r.combinator,
        index: r.index
      })),
      configuration: null,
      result: null
    });
  }, [JSON.stringify(rules)]);

  // Destroy widget from context (remove from the list to unapply its effects)
  useEffect(() => () => dispatch({ type: "deleteWidget", key: id }), []);

  function objectToQuery(obj) {
    return obj.map( item => {
      if(item.AND){
        return {"bool": { "must": objectToQuery(item.AND) } }
      }
      else if(item.OR){
        return {"bool": { "should": objectToQuery(item.OR) } }
      }
      else {
        if(item.field){
          return {"bool": mergedQueries(
            [item].map(r => ({
              ...r,
              query: operators.find(o => o.value === r.operator).query(r.field, r.value)
            }))
          )};
        }
      }
    });
  }

  function buildMainQuery(structuredObject){
    return objectToQuery(structuredObject)[0] 
  }

  return (
    <div className="react-es-query-builder">
      {rules.map(rule => (
        <Rule
          combinator={rule.combinator}
          field={rule.field}
          operator={rule.operator}
          value={rule.value}
          fields={fields}
          operators={operators}
          combinators={combinators}
          key={rule.key}
          index={rule.index}
          autoComplete={autoComplete}
          onAdd={() => {
            setRules([...rules, { ...templateRule, index: rules.length, key: uuidv4() }]);
          }}
          onDelete={index => {
            setRules(
              rules
                .filter(e => e.index !== index)
                .filter(e => e)
                .map((v, k) => ({ ...v, index: k }))
            );
          }}
          onChange={r => {
            rules[r.index] = { ...r, key: rules[r.index].key };
            setRules([...rules]);
          }}
        />
      ))}
    </div>
  );
}
