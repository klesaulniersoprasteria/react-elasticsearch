import React, { useEffect, useState } from "react";
import { useSharedContext } from "./SharedContextProvider";
import Pagination from "./Pagination";

// Pagination, informations about results (like "30 results")
// and size (number items per page) are customizable.
export default function({ itemsPerPage, initialPage = 1, pagination, stats, items, id, sort, saveListRefs }) {
  const [{ widgets }, dispatch] = useSharedContext();
  const [initialization, setInitialization] = useState(true);
  const [page, setPage] = useState(initialPage);
  const widget = widgets.get(id);
  const listResultWidget = widgets.get("listRes");
  const data = widget && widget.result && widget.result.data ? widget.result.data : [];
  const listResultData = listResultWidget && listResultWidget.result && listResultWidget.result.data ? listResultWidget.result.data : [];
  const total = widget && widget.result && widget.result.total ? widget.result.total : 0;
  itemsPerPage = itemsPerPage || 10;

  useEffect(() => {
    setPage(initialization ? initialPage : 1);
    return () => setInitialization(false);
  }, [total]);

  // Update context with page (and itemsPerPage)
  useEffect(() => {
    dispatch({
      type: "setWidget",
      key: id,
      needsQuery: false,
      needsConfiguration: true,
      isFacet: false,
      wantResults: true,
      query: null,
      value: null,
      configuration: { itemsPerPage, page, sort },
      result: data && total ? { data, total } : null
    });
  }, [page, sort]);

  //Création du widget permettant de récupérer la liste des résultat n-100 et n+100
  useEffect(() => {
    dispatch({
      type: "setWidget",
      key: "listRes",
      needsQuery: false,
      needsConfiguration: true,
      isFacet: false,
      wantResults: false,
      listResult: true,
      query: null,
      value: null,
      configuration: { itemsPerPage, page, sort },
      result: data && total ? { data, total } : null
    });
  }, [page, sort]);

  useEffect(() => () => dispatch({ type: "deleteWidget", key: "listRes" }), []);

  // Destroy widget from context (remove from the list to unapply its effects)
  useEffect(() => () => dispatch({ type: "deleteWidget", key: id }), []);

  const defaultPagination = () => (
    <Pagination onChange={p => setPage(p)} total={total} itemsPerPage={itemsPerPage} page={page} />
  );

  //Liste des références à conserver pour le système de page avant/après
  const listRefs = listResultData.map(({ _source }) => { return _source.REF});

  if(saveListRefs)
    saveListRefs(listRefs);

  return (
    <div className="react-es-results">
      {stats ? stats(total) : <>{total} results</>}
      <div className="react-es-results-items">{items(data)}</div>
      {pagination ? pagination(total, itemsPerPage, page, setPage) : defaultPagination()}
    </div>
  );
}
