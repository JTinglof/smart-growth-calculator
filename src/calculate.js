import chroma from "chroma-js";

import {
  isNumeric,
  formatNumber,
  calculatePct,
  formatPctStr,
  forceArray,
} from "./utils";

function getTypologyFromPct(pct) {
  // very simple way of defining bins (equal interval)
  // should do jenks (?)

  if (pct < 33) {
    return "integrated";
  } else if (pct < 66) {
    return "transitioning";
  } else {
    return "emerging";
  }
}

function getColor(
  value,
  values,
  scale = ["DeepSkyBlue", "Gold", "Crimson"],
  mode = "q",
  steps = 9
) {
  // this is sloppy, rewrite later...

  values = values.filter(isNumeric);

  let limits = chroma.limits(values, mode, steps - 1);
  let colors = chroma.scale(scale).colors(limits.length);

  for (var i = 0; i < limits.length; i++) {
    if (featureValue <= limits[i]) {
      return colors[i];
      break;
    }
  }
  return null;
}

function clearReadout(prop) {
  let $stat = document.querySelector(`#stat-${prop}`);
  let $bar = document.querySelector(`#bar-${prop} > .bar`);

  $bar.className = "bar na";
  $stat.innerHTML = "N/A";
}

export function clearReadouts() {
  PROPERTY_ORDER.forEach(clearReadout);
}

export function populateReadouts(features, verbose = false) {
  PROPERTY_ORDER.forEach((prop) => {
    let info = property_config[prop];
    let $stat = document.querySelector(`#stat-${prop}`);
    let $bar = document.querySelector(`#bar-${prop} > .bar`);
    let val = info.summarizer(features);

    if (isNumeric(val)) {
      let { avg } = info.range;

      let pct = calculatePct(val, info.range);

      let pctDiff = Math.floor(((val - avg) / ((val + avg) / 2.0)) * 100);
      let pctDiffStr = pctDiff > 0 ? "+%" + pctDiff : "-%" + Math.abs(pctDiff);

      $bar.style.width = formatPctStr(pct);

      $stat.innerHTML = `${formatNumber(val, info.precision)} (${pctDiffStr})`;
      if (info.invert) {
        $bar.className = `bar no-typology`;
      } else {
        $bar.className = `bar ${getTypologyFromPct(
          info.invert ? 100 - pct : pct
        )}`;
      }
    } else {
      clearReadout(prop);
    }
  });
}

// in most cases, metrics can be aggregated with this simple summarizer (which just averages)
function createSimpleSummarizer(prop) {
  // return function that encloses the `prop` value
  return (features) => {
    features = forceArray(features);
    let valid_features = features.filter((f) => isNumeric(f.properties[prop]));

    if (valid_features.length === 0) {
      return undefined;
    }

    let sum = valid_features.reduce(
      (total, f) => total + f.properties[prop],
      0
    );

    return sum / features.length;
  };
}

// array that defines order of metrics to be dispayed
// if you want to change the order, change the order of these items.
export const PROPERTY_ORDER = [
  "vmt_perCapita2010",
  "vmt_hbw2010",
  "hh_type1_v",
  "ghg_hh_annual",
  "housing",
  "afford-transport",
  "ghg_cap",
  "ghg_emp",
  "pedcol",
  "cardio",
  "obesity",
  "pop-density",
  "jobs-density",
  "dwelling-density",
  "Jobs45Tran",
  "Jobs45Auto",
  "ped-environment",
  "walkscore",
  "walkshare",
];

/*
This object defines the metrics to be display as well as some other configuration details 
related to the display and aggregation of multiple values.  The `summarizer` property 
defines how values will be aggregated (in cases where mutiple features have been selected).
*/
export let property_config = {
  vmt_perCapita2010: {
    name: "Vehicle Miles Traveled per Capita",
    dom_name: "vmt_perCapita2010",
    precision: 0,
    attribute: "vmt_perCapita2010",
    summarizer: createSimpleSummarizer("vmt_perCapita2010"),
  },
  vmt_hbw2010: {
    name: "Home Base Work Vehicle Miles Traveled per Capita",
    dom_name: "vmt_hbw2010",
    precision: 0,
    attribute: "vmt_hbw2010",
    summarizer: createSimpleSummarizer("vmt_hbw2010"),
  },
  hh_type1_v: {
    name: "Vehicle Miles Traveled per Household (Annual)",
    dom_name: "hh_type1_v",
    precision: 0,
    attribute: "hh_type1_v",
    summarizer: createSimpleSummarizer("hh_type1_v"),
  },
  ghg_hh_annual: {
    name: "Carbon Emissions Per Household (Annual)",
    dom_name: "ghg_hh_annual",
    precision: 0,
    summarizer: (features) => {
      features = forceArray(features);

      let valid_features = features.filter((f) =>
        isNumeric(f.properties["hh_type1_v"])
      );

      if (valid_features.length == 0) {
        return undefined;
      }

      let sum = valid_features.reduce((total, f) => {
        return total + f.properties["hh_type1_v"] * 0.79;
      }, 0);

      return sum / features.length;
    },
  },
  housing: {
    name: "Housing Affordability",
    dom_name: "housing",
    precision: 1,
    attribute: "hh_type1_h",
    summarizer: createSimpleSummarizer("hh_type1_h"),
  },
  "afford-transport": {
    name: "Transportation Affordability",
    dom_name: "afford-transport",
    precision: 1,
    attribute: "hh_type1_t",
    summarizer: createSimpleSummarizer("hh_type1_t"),
  },
  ghg_cap: {
    name: "Carbon Emissions per Capita",
    dom_name: "ghg_cap",
    precision: 0,
    summarizer: (features) => {
      features = forceArray(features);

      let valid_features = features.filter((f) =>
        isNumeric(f.properties["vmt_perCapita2010"])
      );

      if (valid_features.length == 0) {
        return undefined;
      }

      let sum = valid_features.reduce((total, f) => {
        return total + f.properties["vmt_perCapita2010"] * 0.9;
      }, 0);

      return sum / features.length;
    },
  },
  ghg_emp: {
    name: "Carbon Emissions per Employee",
    dom_name: "ghg_emp",
    precision: 0,
    summarizer: (features) => {
      features = forceArray(features);

      let valid_features = features.filter((f) =>
        isNumeric(f.properties["vmt_perEmploy2010"])
      );

      if (valid_features.length == 0) {
        return undefined;
      }

      let sum = valid_features.reduce((total, f) => {
        return total + f.properties["vmt_perEmploy2010"] * 0.9;
      }, 0);

      return sum / features.length;
    },
  },
  pedcol: {
    name: "Pedestrian Collisions",
    dom_name: "pedcol",
    precision: 1,
    summarizer: (features) => {
      features = forceArray(features);

      let valid_features = features.filter((f) => {
        let props = ["SumAllPed", "JTW_WALK", "JTW_TOTAL", "TOTPOP10"];

        for (let i = 0; i < props.length; i++) {
          if (!isNumeric(f.properties[props[i]])) {
            return false;
          }
        }

        return true;
      });

      if (valid_features.length == 0) {
        return undefined;
      }

      let sums = valid_features.reduce(
        (totals, f) => {
          let props = f.properties;

          totals["SumAllPed"] += parseInt(props["SumAllPed"]);
          totals["JTW_WALK"] += parseInt(props["JTW_WALK"]);
          totals["JTW_TOTAL"] += parseInt(props["JTW_TOTAL"]);
          totals["TOTPOP10"] += parseInt(props["TOTPOP10"]);

          return totals;
        },
        { SumAllPed: 0, JTW_WALK: 0, JTW_TOTAL: 0, TOTPOP10: 0 }
      );

      return (
        (100000 * (sums["SumAllPed"] / sums["TOTPOP10"])) /
        (sums["JTW_WALK"] / sums["JTW_TOTAL"]) /
        365.25
      );
    },
  },
  cardio: {
    name: "Cardiovascular Disease",
    dom_name: "cardio",
    precision: 1,
    attribute: "CHD_Crude1",
    summarizer: createSimpleSummarizer("CHD_Crude1"),
  },
  obesity: {
    name: "Obesity",
    dom_name: "obesity",
    precision: 1,
    attribute: "OBESITY_C1",
    summarizer: createSimpleSummarizer("OBESITY_C1"),
  },
  "pop-density": {
    name: "Population Density",
    dom_name: "pop-density",
    precision: 1,
    attribute: "D1B",
    invert: true, // some metrics need to be inverted, to conform with high = bad
    summarizer: createSimpleSummarizer("D1B"),
  },
  "jobs-density": {
    name: "Jobs Density",
    dom_name: "jobs-density",
    precision: 1,
    attribute: "D1C",
    invert: true, // some metrics need to be inverted, to conform with high = bad
    summarizer: createSimpleSummarizer("D1C"),
  },
  "dwelling-density": {
    name: "Dwelling Density",
    dom_name: "dwelling-density",
    precision: 1,
    attribute: "D1A",
    invert: true, // some metrics need to be inverted, to conform with high = bad
    summarizer: createSimpleSummarizer("D1A"),
  },
  Jobs45Tran: {
    name: "Jobs Accessibility From Transit",
    dom_name: "Jobs45Tran",
    precision: 0,
    attribute: "Jobs45Tran",
    invert: true, // some metrics need to be inverted, to conform with high = bad
    summarizer: createSimpleSummarizer("Jobs45Tran"),
  },
  Jobs45Auto: {
    name: "Jobs Accessible From Auto",
    dom_name: "Jobs45Auto",
    precision: 0,
    attribute: "Jobs45Auto",
    invert: true, // some metrics need to be inverted, to conform with high = bad
    summarizer: createSimpleSummarizer("Jobs45Auto"),
  },
  "ped-environment": {
    name: "Pedestrian Environment (Walkability)",
    dom_name: "ped-environment",
    precision: 1,
    attribute: "D3b",
    invert: true,
    summarizer: createSimpleSummarizer("D3b"),
  },
  walkscore: {
    name: "WalkScore",
    dom_name: "walkscore",
    precision: 1,
    attribute: "walkscore",
    invert: true, // some metrics need to be inverted, to conform with high = bad
    summarizer: createSimpleSummarizer("walkscore"),
  },
  walkshare: {
    name: "Walking Percent (Walkshare)",
    dom_name: "walkshare",
    precision: 1,
    invert: true, // some metrics need to be inverted, to conform with high = bad
    summarizer: (features) => {
      features = forceArray(features);

      let valid_features = features.filter((f) => {
        let props = ["JTW_WALK", "JTW_TOTAL"];

        for (let i = 0; i < props.length; i++) {
          if (!isNumeric(f.properties[props[i]])) {
            return false;
          }
        }

        return true;
      });

      if (valid_features.length == 0) {
        return undefined;
      }

      let sums = valid_features.reduce(
        (totals, f) => {
          let props = f.properties;

          totals["JTW_WALK"] += parseFloat(props["JTW_WALK"]);
          totals["JTW_TOTAL"] += parseFloat(props["JTW_TOTAL"]);

          return totals;
        },
        { JTW_WALK: 0, JTW_TOTAL: 0 }
      );

      return (100 * sums["JTW_WALK"]) / sums["JTW_TOTAL"];
    },
  },
};
