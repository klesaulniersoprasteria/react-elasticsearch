import React from "react";

function verifInputPage(targetPage, maxPage){
  if(isNaN(targetPage)){
    return 1;
  }
  else if(targetPage < 1){
    return 1;
  }
  else if(targetPage > maxPage){
    return maxPage;
  }
  else{
    return targetPage;
  }
}

export default function({ onChange, total, itemsPerPage, page }) {
  const max = Math.min(Math.ceil(total / itemsPerPage), 10000 / itemsPerPage);

  if(page <= 1){
    return (
      <ul className="react-es-pagination">
        <li key={page}>
        <input defaultValue={page} size="3" onBlur={(e) => onChange(verifInputPage(e.target.value, max))} onKeyPress={(e) => {if(e.key === "Enter"){onChange(verifInputPage(e.target.value, max))} return true;} }/>
        </li>
        <li key={page+1}>
          <button title="Page précédente" onClick={() => onChange(page + 1)}>&rsaquo;</button>
        </li>
        <li key={max+1}>
          <button title="Dernière page" onClick={() => onChange(max)}>&raquo;</button>
        </li>
      </ul>
    );
  }
  else if(page == max) {
    return (
      <ul className="react-es-pagination">
        <li key={0}>
          <button title="Première page" onClick={() => onChange(1)}>&laquo;</button>
        </li>
        <li key={page-1}>
          <button title="Page précédente" onClick={() => onChange(page - 1)}>&lsaquo;</button>
        </li>
        <li key={page}>
        <input defaultValue={page} size="3" onBlur={(e) => onChange(verifInputPage(e.target.value, max))} onKeyPress={(e) => {if(e.key === "Enter"){onChange(verifInputPage(e.target.value, max))} return true;} }/>
        </li>
      </ul>
    );
  }
  else{
    return (
      <ul className="react-es-pagination">
        <li key={0}>
          <button title="Première page" onClick={() => onChange(1)}>&laquo;</button>
        </li>
        <li key={page-1}>
          <button title="Page précédente" onClick={() => onChange(page - 1)}>&lsaquo;</button>
        </li>
        <li key={page}>
        <input defaultValue={page} size="3" onBlur={(e) => onChange(verifInputPage(e.target.value, max))} onKeyPress={(e) => {if(e.key === "Enter"){onChange(verifInputPage(e.target.value, max))} return true;} }/>
        </li>
        <li key={page+1}>
          <button title="Page précédente" onClick={() => onChange(page + 1)}>&rsaquo;</button>
        </li>
        <li key={max+1}>
          <button title="Dernière page" onClick={() => onChange(max)}>&raquo;</button>
        </li>
      </ul>
    );
  }
}
