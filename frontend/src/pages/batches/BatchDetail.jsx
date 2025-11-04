// src/pages/BatchDetail.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Container, Stack, Typography, IconButton,
  Card, CardContent, Grid, CircularProgress, Alert,
  Accordion, AccordionSummary, AccordionDetails, Chip, Box
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate, useParams } from "react-router-dom";
import { getBatch, getBatchReport } from "../../api/batches";

const StatusChip = ({ status }) => (
  <Chip
    size="small"
    label={status}
    color={
      status==="succeeded"?"success":
      status==="failed"   ?"error":
      status==="running"  ?"warning":"default"
    }
    variant="outlined"
  />
);

export default function BatchDetail() {
  const { batchId } = useParams();
  const nav = useNavigate();

  const [batch, setBatch] = useState(null);
  const [report, setReport] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    setErr(""); setLoading(true);
    try {
      const [b,r] = await Promise.all([getBatch(batchId), getBatchReport(batchId)]);
      setBatch(b); setReport(r);
    } catch(e){ setErr(String(e)); }
    setLoading(false);
  },[batchId]);

  useEffect(()=>{ hydrate(); },[hydrate]);

  const calls = report?.calls || [];

  return (
    <Container maxWidth="lg" sx={{ py:3 }}>
      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
        <IconButton onClick={()=>nav("/batches")}><ArrowBackIcon/></IconButton>
        <Typography variant="h5">Batch #{batchId}</Typography>
      </Stack>

      {err && <Alert severity="error">{err}</Alert>}
      {loading||!batch ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress/></Box>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card><CardContent>
              <Stack direction="row" justifyContent="space-between" flexWrap="wrap">
                <Typography variant="h6">{batch.name}</Typography>
                <StatusChip status={batch.status}/>
              </Stack>
            </CardContent></Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Calls</Typography>
                <Stack spacing={2} sx={{ maxHeight: "70vh", overflowY: "auto" }}>
                  {calls.map((c) => (
                    <Card key={c.call_id} variant="outlined">
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="subtitle1" sx={{ fontFamily: "monospace" }}>
                            {c.call_id}
                          </Typography>
                          <Chip size="small" label={c.status||"-"} color={c.status==="succeeded"?"success":c.status==="failed"?"error":"default"} variant="outlined"/>
                        </Stack>

                        {/* Transcript text */}
                        {c.summary?.transcript ? (
                          <Box sx={{
                            whiteSpace: "pre-wrap",
                            fontSize: 13,
                            maxHeight: 200,
                            overflowY: "auto",
                            border: "1px solid rgba(0,0,0,0.1)",
                            borderRadius: 1,
                            p: 1,
                            mb: 2
                          }}>
                            {c.summary.transcript}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" mb={2}>
                            No transcript available.
                          </Typography>
                        )}

                        {/* Triggers */}
                        <Typography variant="subtitle2" gutterBottom>Triggers</Typography>
                        {(c.triggers || []).length === 0 ? (
                          <Typography variant="body2" color="text.secondary">No triggers evaluated.</Typography>
                        ) : (
                          <Stack spacing={1}>
                            {c.triggers.map((t,i)=>(
                              <Accordion key={i} disableGutters>
                                <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                                  <Typography variant="body2">
                                    Trigger #{t.trigger_id} — {t.matched ? "Matched ✅" : "No match ❌"}
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  {t.evidence && Object.keys(t.evidence).length>0 ? (
                                    <Box sx={{ whiteSpace:"pre-wrap", fontSize:13 }}>
                                      {JSON.stringify(t.evidence,null,2)}
                                    </Box>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">No evidence provided.</Typography>
                                  )}
                                </AccordionDetails>
                              </Accordion>
                            ))}
                          </Stack>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {calls.length===0 && (
                    <Typography variant="body2" color="text.secondary">No calls in this batch yet.</Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
