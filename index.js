import React from 'react';
import PropTypes from 'prop-types';

function search(
  endpoint,
  source,
  accessToken,
  proximity,
  bbox,
  types,
  query,
  callback,
) {
  const searchTime = new Date();

  const uri =
    `${endpoint}/geocoding/v5/${source}/${encodeURIComponent(query)}.json` +
    `?access_token=${accessToken}${proximity ? `&proximity=${proximity}` : ''}${
      bbox ? `&bbox=${bbox}` : ''
    }${types ? `&types=${encodeURIComponent(types)}` : ''}`;

  return fetch(uri)
    .then(response => {
      if (response.status === 200) {
        return response.json();
      }
      throw new Error('Unable to call Geocoder API. Please try again');
    })
    .then(data => {
      callback(null, data, searchTime);
    })
    .catch(err => {
      callback(err);
    });
}

/**
 * Geocoder component: connects to Mapbox.com Geocoding API
 * and provides an autocompleting interface for finding locations.
 */
class Geocoder extends React.Component {
  constructor(props) {
    super(props);

    this.onInput = this.onInput.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onResult = this.onResult.bind(this);
    this.moveFocus = this.moveFocus.bind(this);
    this.acceptFocus = this.acceptFocus.bind(this);
    this.clickOption = this.clickOption.bind(this);
    this.clickOption = this.clickOption.bind(this);

    const { addressSearch } = this.props;

    this.state = {
      results: [],
      focus: null,
      loading: false,
      searchTime: new Date(),
      addressSearch,
    };
  }

  componentWillReceiveProps(props) {
    const { addressSearch } = props;

    this.setState({ addressSearch });
  }

  onInput(e) {
    this.setState({ loading: true });
    const { value } = e.target;
    if (value === '') {
      this.setState({
        results: [],
        focus: null,
        loading: false,
      });
    } else {
      search(
        this.props.endpoint,
        this.props.source,
        this.props.accessToken,
        this.props.proximity,
        this.props.bbox,
        this.props.types,
        value,
        this.onResult,
      );
    }
  }

  onKeyDown(e) {
    switch (e.which) {
      // up
      case 38:
        e.preventDefault();
        this.moveFocus(-1);
        break;
      // down
      case 40:
        this.moveFocus(1);
        break;
      // accept
      case 13:
        if (this.state.results.length > 0 && this.state.focus == null) {
          this.clickOption(this.state.results[0], 0);
        }
        this.acceptFocus();
        break;
      default:
        break;
    }
  }

  onResult(err, data, searchTime) {
    // searchTime is compared with the last search to set the state
    // to ensure that a slow xhr response does not scramble the
    // sequence of autocomplete display.
    if (!err && data && data.features && this.state.searchTime <= searchTime) {
      this.setState({
        searchTime,
        loading: false,
        results: data.features,
        focus: null,
      });
      this.props.onSuggest(this.state.results);
    }
  }

  moveFocus(dir) {
    if (this.state.loading) return;
    this.setState({
      focus:
        this.state.focus === null
          ? 0
          : Math.max(
              0,
              Math.min(this.state.results.length - 1, this.state.focus + dir),
            ),
    });
  }

  acceptFocus() {
    if (this.state.focus !== null) {
      this.props.onSelect(this.state.results[this.state.focus]);
    }
  }

  clickOption(place) {
    this.props.onSelect(place);
    // this.setState({ focus: listLocation });
    this.setState({
      results: [],
      focus: null,
      loading: false,
    });
    // focus on the input after click to maintain key traversal
    // ReactDOM.findDOMNode(this.refs.input).focus();
    return false;
  }

  render() {
    const input = (
      <input
        className={this.props.inputClass}
        onInput={this.onInput}
        onKeyDown={this.onKeyDown}
        placeholder={this.props.inputPlaceholder}
        id={this.props.inputId}
        type="text"
        value={this.state.addressSearch}
        onChange={e => this.setState({ addressSearch: e.target.value })}
      />
    );
    return (
      <div>
        {this.props.inputPosition === 'top' && input}
        {this.state.results.length > 0 && (
          <ul
            className={`list-group ${
              this.props.showLoader && this.state.loading ? 'loading' : ''
            } ${this.props.resultsClass}`}
          >
            {this.state.results.map((result, i) => (
              <li key={result.id} className="list-group-item">
                <span
                  role="button"
                  tabIndex={i}
                  onClick={() => this.clickOption(result, i)}
                  onKeyPress={() => this.clickOption(result, i)}
                  style={{ cursor: 'pointer' }}
                  className={`${this.props.resultClass} ${
                    i === this.state.focus ? this.props.resultFocusClass : ''
                  }`}
                >
                  {result.place_name}
                </span>
              </li>
            ))}
          </ul>
        )}
        {this.props.inputPosition === 'bottom' && input}
      </div>
    );
  }
}

Geocoder.propTypes = {
  endpoint: PropTypes.string,
  source: PropTypes.string,
  inputClass: PropTypes.string,
  resultClass: PropTypes.string,
  resultsClass: PropTypes.string,
  inputId: PropTypes.string,
  inputPosition: PropTypes.string,
  inputPlaceholder: PropTypes.string,
  resultFocusClass: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onSuggest: PropTypes.func,
  accessToken: PropTypes.string.isRequired,
  proximity: PropTypes.string,
  bbox: PropTypes.string,
  showLoader: PropTypes.bool,
  // focusOnMount: PropTypes.bool,
  types: PropTypes.string,
  addressSearch: PropTypes.string,
};

Geocoder.defaultProps = {
  endpoint: 'https://api.tiles.mapbox.com',
  inputClass: '',
  resultClass: '',
  resultsClass: '',
  resultFocusClass: 'strong',
  inputId: 'top',
  inputPosition: 'top',
  inputPlaceholder: 'Search',
  showLoader: false,
  source: 'mapbox.places',
  proximity: '',
  bbox: '',
  types: '',
  addressSearch: '',
  onSuggest() {},
  // focusOnMount: true,
};

export default Geocoder;
