import ReactPaginateModule from 'react-paginate'
import { IconChevronLeft, IconChevronRight } from '../../components/Layout/Sidebar/icons'

const ReactPaginate = ReactPaginateModule?.default ?? ReactPaginateModule

function Pager({ page, pageSize, totalItems, totalPages, onChange, label = 'records' }) {
  if (totalItems === 0) return null

  const firstShown = (page - 1) * pageSize + 1
  const lastShown = Math.min(page * pageSize, totalItems)

  return (
    <div className="emp-pagination">
      <p>
        Showing {firstShown} to {lastShown} of {totalItems} {label}
      </p>

      <ReactPaginate

        forcePage={page - 1}
        pageCount={totalPages}
        onPageChange={({ selected }) => onChange(selected + 1)}

        pageRangeDisplayed={2}
        marginPagesDisplayed={1}
        breakLabel="…"
        previousLabel={<IconChevronLeft />}
        nextLabel={<IconChevronRight />}
        renderOnZeroPageCount={null}
        containerClassName="emp-pager"
        pageClassName="emp-pager-item"
        pageLinkClassName="emp-pager-link"
        previousClassName="emp-pager-item"
        previousLinkClassName="emp-pager-link emp-pager-link--arrow"
        nextClassName="emp-pager-item"
        nextLinkClassName="emp-pager-link emp-pager-link--arrow"
        breakClassName="emp-pager-item"
        breakLinkClassName="emp-pager-link emp-pager-link--break"
        activeClassName="is-active"
        disabledClassName="is-disabled"
      />
    </div>
  )
}

export default Pager
