import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TablePagination,
  TextField,
  Box,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTheme } from '@mui/material/styles';

function CustomTable({ columns, data, actions }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Vérification des petits écrans

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredData = data.filter((row) => {
    return columns.some((column) => {
      const value = row[column.field];
      return value && value.toString().toLowerCase().includes(searchTerm);
    });
  });

  const handleRowClick = (rowId) => {
    actions[0].onClick(rowId); // Par défaut, clique sur "Voir Détails"
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="left" mb={2}>
        <Box display="flex" alignItems="center">
          <SearchIcon sx={{ marginRight: '8px' }} />
          <TextField
            label="Rechercher"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </Box>
      </Box>

      {/* Ajout de overflowX pour le scroll horizontal sur mobile */}
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id}>{column.label}</TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  onClick={() => handleRowClick(row.id)} // La ligne devient cliquable
                  sx={{ cursor: 'pointer' }} // Ajout du curseur pour indiquer que la ligne est cliquable
                >
                  {columns.map((column) => (
                    <TableCell key={column.id}>{row[column.field]}</TableCell>
                  ))}
                  <TableCell>
                    <Box display="flex" flexDirection={isMobile ? 'column' : 'row'}>
                      {/* Icône pour Voir Détails */}
                      <IconButton
                        aria-label="Voir détails"
                        color="primary"
                        onClick={(e) => { e.stopPropagation(); actions[0].onClick(row.id); }}
                        size={isMobile ? 'small' : 'medium'}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredData.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Lignes par page"
      />
    </>
  );
}

export default CustomTable;
